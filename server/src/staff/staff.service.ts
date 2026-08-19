import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import argon2 from 'argon2'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateStaffDto, ListStaffDto, UpdateStaffDto } from './dto/staff.dto'

const TENANT_ID = 1n

type StaffWithRelations = {
  id: bigint
  publicId: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  status: string
  createdAt: Date
  role: { name: string }
  branch: { name: string } | null
  _count?: {
    assignedLeads: number
    assignedStudents: number
    assignedApplications: number
  }
}

@Injectable()
export class StaffService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.client
  }

  async list(query: ListStaffDto) {
    const where: Record<string, unknown> = { tenantId: TENANT_ID, deletedAt: null }
    if (query.role) where.role = { name: query.role }
    if (query.branch) where.branch = { name: query.branch }
    if (query.status) where.status = query.status === 'Active' ? 'active' : 'disabled'
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ]
    }

    const rows = await this.db.user.findMany({
      where,
      include: this.relations,
      orderBy: { id: 'asc' },
    })
    return rows.map((r) => this.toDto(r as StaffWithRelations))
  }

  async get(id: number) {
    const staff = await this.db.user.findFirst({
      where: { id: BigInt(id), tenantId: TENANT_ID, deletedAt: null },
      include: this.relations,
    })
    if (!staff) throw new NotFoundException(`Staff member ${id} not found.`)
    return this.toDto(staff as StaffWithRelations)
  }

  /**
   * Assignable staff for the "Assign to" pickers across leads, students and
   * applications. Returns ids alongside names — the pickers still display
   * names, but writes now carry the id, so renaming someone no longer orphans
   * their assignments.
   */
  async assignable() {
    const rows = await this.db.user.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null, status: 'active' },
      select: { id: true, name: true, role: { select: { name: true } } },
      orderBy: { name: 'asc' },
    })
    // Students log in through the same table but are not assignable staff.
    return rows
      .filter((r) => r.role.name !== 'Student')
      .map((r) => ({ id: Number(r.id), name: r.name, role: r.role.name }))
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.db.user.findFirst({
      where: { tenantId: TENANT_ID, email: dto.email.toLowerCase().trim() },
    })
    if (existing) throw new ConflictException('A user with that email already exists.')

    const links = await this.resolveLinks(dto)
    if (!links.roleId) throw new NotFoundException(`Role "${dto.role}" not found.`)

    // New staff need a password to sign in. A caller-supplied one is hashed the
    // same way as the seed; without one the account is created disabled rather
    // than with a guessable default.
    const passwordHash = await argon2.hash(dto.password ?? crypto.randomUUID())

    const created = await this.db.user.create({
      data: {
        tenantId: TENANT_ID,
        name: dto.name,
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone ?? null,
        passwordHash,
        roleId: links.roleId,
        branchId: links.branchId,
        status: dto.password ? 'active' : 'invited',
        avatarUrl: dto.avatar ?? null,
      },
      include: this.relations,
    })
    return this.toDto(created as StaffWithRelations)
  }

  async update(id: number, dto: UpdateStaffDto) {
    await this.get(id)
    const links = await this.resolveLinks(dto)

    const data: Record<string, unknown> = {
      name: dto.name ?? undefined,
      email: dto.email ? dto.email.toLowerCase().trim() : undefined,
      phone: dto.phone ?? undefined,
      roleId: links.roleId ?? undefined,
      branchId: links.branchId ?? undefined,
      avatarUrl: dto.avatar ?? undefined,
    }
    if (dto.status) data.status = dto.status === 'Active' ? 'active' : 'disabled'
    if (dto.password) data.passwordHash = await argon2.hash(dto.password)

    const updated = await this.db.user.update({
      where: { id: BigInt(id) },
      data,
      include: this.relations,
    })
    return this.toDto(updated as StaffWithRelations)
  }

  /**
   * Soft delete. The row stays so historical assignments still resolve to a
   * name — hard-deleting would leave leads and applications pointing at a
   * missing user.
   */
  async remove(id: number) {
    await this.get(id)
    await this.db.user.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date(), status: 'disabled' },
    })
    return { ok: true }
  }

  async roles() {
    const rows = await this.db.role.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      include: { _count: { select: { users: true } } },
      orderBy: { id: 'asc' },
    })
    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      permissions: Array.isArray(r.permissions) ? (r.permissions as string[]) : [],
      isSystem: r.isSystem,
      userCount: r._count.users,
    }))
  }

  async branches() {
    const rows = await this.db.branch.findMany({
      where: { tenantId: TENANT_ID, deletedAt: null },
      include: { _count: { select: { users: true, leads: true, students: true } } },
      orderBy: { name: 'asc' },
    })
    return rows.map((b) => ({
      id: Number(b.id),
      name: b.name,
      address: b.address ?? '',
      phone: b.phone ?? '',
      staffCount: b._count.users,
      leadCount: b._count.leads,
      studentCount: b._count.students,
    }))
  }

  private readonly relations = {
    role: true,
    branch: true,
    // Workload counted through foreign keys rather than by matching names.
    // The mock compared `assignedTo === name`, so renaming a staff member
    // silently orphaned every record assigned to them.
    _count: {
      select: {
        assignedLeads: { where: { deletedAt: null } },
        assignedStudents: { where: { deletedAt: null } },
        assignedApplications: { where: { deletedAt: null } },
      },
    },
  } as const

  private async resolveLinks(dto: CreateStaffDto | UpdateStaffDto) {
    const [role, branch] = await Promise.all([
      dto.role ? this.db.role.findFirst({ where: { tenantId: TENANT_ID, name: dto.role } }) : null,
      dto.branch
        ? this.db.branch.findFirst({ where: { tenantId: TENANT_ID, name: dto.branch } })
        : null,
    ])
    return { roleId: role?.id ?? null, branchId: branch?.id ?? null }
  }

  /** Rebuild the flat shape src/mock/staffStore.ts exposed. */
  private toDto(u: StaffWithRelations) {
    const d = u.createdAt
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
      id: Number(u.id),
      publicId: u.publicId,
      name: u.name,
      email: u.email,
      phone: u.phone ?? '',
      role: u.role.name,
      branch: u.branch?.name ?? '',
      status: u.status === 'active' ? 'Active' : 'Inactive',
      joined: `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      avatar: u.avatarUrl ?? undefined,
      workload: {
        leads: u._count?.assignedLeads ?? 0,
        students: u._count?.assignedStudents ?? 0,
        applications: u._count?.assignedApplications ?? 0,
      },
    }
  }
}
