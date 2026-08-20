import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { JwtPayload } from './auth.types'

const TENANT_ID = 1n

/**
 * Resolves "which student is this caller?" for the portal.
 *
 * Students hold no permissions — a portal user must reach their *own*
 * application and documents, and nothing else, which is a different question
 * from the yes/no one `PermissionsGuard` answers. Granting them
 * `view-applications` would have meant every application, so ownership is
 * resolved per request instead.
 *
 * The link is `students.userId`, an explicit foreign key. Matching on email
 * would be wrong twice over: the seeded portal login (student@gmail.com)
 * differs from the student's contact address (rohan.das@gmail.com), and a
 * student who edits their own email would lose access to their records.
 */
@Injectable()
export class StudentScopeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.client
  }

  /** True when the caller is a portal student rather than staff. */
  isStudent(user?: JwtPayload): boolean {
    return user?.role === 'Student'
  }

  /**
   * The student row behind a portal login.
   *
   * Throws rather than returning null: a Student-role token with no student
   * record cannot be served safely — falling through would hand them the
   * unfiltered staff view.
   */
  async requireStudentId(user: JwtPayload): Promise<bigint> {
    const account = await this.db.user.findFirst({
      where: { publicId: user.sub, tenantId: TENANT_ID, deletedAt: null },
      select: { studentProfile: { select: { id: true, deletedAt: true } } },
    })
    const student = account?.studentProfile
    if (!student || student.deletedAt) {
      throw new ForbiddenException('This login is not linked to a student record.')
    }
    return student.id
  }

  /**
   * Confirm a student owns an application before it is read or written.
   * Returns silently for staff, who are already gated by permissions.
   */
  async assertOwnsApplication(user: JwtPayload | undefined, applicationId: number): Promise<void> {
    if (!user || !this.isStudent(user)) return

    const studentId = await this.requireStudentId(user)
    const owned = await this.db.application.findFirst({
      where: {
        id: BigInt(applicationId),
        studentId,
        tenantId: TENANT_ID,
        deletedAt: null,
      },
      select: { id: true },
    })
    // Deliberately the same error whether the application belongs to someone
    // else or does not exist — distinguishing them would let a student probe
    // for valid ids.
    if (!owned) throw new ForbiddenException('Application not found.')
  }

  /**
   * Confirm a student owns an invoice before it is read.
   *
   * Same shape as the application check, and the same reason: a student must
   * see their own bill and no one else's, which the `invoice` permission cannot
   * express — that permission means "every invoice", which is a staff answer.
   */
  async assertOwnsInvoice(user: JwtPayload | undefined, invoiceId: number): Promise<void> {
    if (!user || !this.isStudent(user)) return

    const studentId = await this.requireStudentId(user)
    const owned = await this.db.invoice.findFirst({
      where: {
        id: BigInt(invoiceId),
        studentId,
        tenantId: TENANT_ID,
        deletedAt: null,
      },
      select: { id: true },
    })
    if (!owned) throw new ForbiddenException('Invoice not found.')
  }
}
