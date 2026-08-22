import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { JwtPayload } from './auth.types'

const TENANT_ID = 1n

@Injectable()
export class AgentScopeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.client
  }

  isAgent(user?: JwtPayload): boolean {
    return user?.role === 'Agent'
  }

  async requireAgentId(user: JwtPayload): Promise<bigint> {
    const account = await this.db.user.findFirst({
      where: { publicId: user.sub, tenantId: TENANT_ID, deletedAt: null },
      select: { agentProfile: { select: { id: true, deletedAt: true } } },
    })
    const agent = account?.agentProfile
    if (!agent || agent.deletedAt) {
      throw new ForbiddenException('This login is not linked to an agent record.')
    }
    return agent.id
  }

  async assertOwnsLead(user: JwtPayload | undefined, leadId: number): Promise<void> {
    if (!user || !this.isAgent(user)) return
    const agentId = await this.requireAgentId(user)
    const owned = await this.db.lead.findFirst({
      where: { id: BigInt(leadId), referredByAgentId: agentId, tenantId: TENANT_ID, deletedAt: null },
      select: { id: true },
    })
    if (!owned) throw new ForbiddenException('Lead not found.')
  }

  async assertOwnsStudent(user: JwtPayload | undefined, studentId: number): Promise<void> {
    if (!user || !this.isAgent(user)) return
    const agentId = await this.requireAgentId(user)
    const owned = await this.db.student.findFirst({
      where: { id: BigInt(studentId), referredByAgentId: agentId, tenantId: TENANT_ID, deletedAt: null },
      select: { id: true },
    })
    if (!owned) throw new ForbiddenException('Student not found.')
  }

  async assertOwnsApplication(user: JwtPayload | undefined, applicationId: number): Promise<void> {
    if (!user || !this.isAgent(user)) return
    const agentId = await this.requireAgentId(user)
    const owned = await this.db.application.findFirst({
      where: { id: BigInt(applicationId), agentId, tenantId: TENANT_ID, deletedAt: null },
      select: { id: true },
    })
    if (!owned) throw new ForbiddenException('Application not found.')
  }

  async assertCanSubmitApplications(user: JwtPayload | undefined): Promise<void> {
    if (!user || !this.isAgent(user)) return
    const agentId = await this.requireAgentId(user)
    const setting = await this.db.appSetting.findUnique({
      where: { tenantId_key: { tenantId: TENANT_ID, key: 'agents.allowApplicationSubmission' } },
      select: { value: true },
    })
    const systemEnabled = setting?.value === true
    const agent = await this.db.agent.findFirst({
      where: { id: agentId, tenantId: TENANT_ID, deletedAt: null },
      select: { canSubmitApplications: true },
    })
    if (!systemEnabled || !agent?.canSubmitApplications) {
      throw new ForbiddenException('Application submission is not enabled for this agent.')
    }
  }
}