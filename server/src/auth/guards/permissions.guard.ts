import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { JwtPayload } from '../auth.types'

export const PERMISSIONS_KEY = 'requiredPermissions'

/**
 * Restrict a route to holders of specific permissions.
 *
 * Permission ids match those already defined in the frontend's
 * `src/mock/roles.ts` (e.g. 'view-leads', 'lead-create-update'), so the
 * existing Roles admin screen keeps working once it is wired to the API.
 *
 *   @RequirePermission('view-leads')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)

export const ALLOW_STUDENT_KEY = 'allowStudent'
export const ALLOW_AGENT_KEY = 'allowAgent'

/** Let an Agent-role token pass a permission gate on an explicitly scoped route. */
export const AllowAgent = () => SetMetadata(ALLOW_AGENT_KEY, true)

/**
 * Let a Student-role token past the permission check on a portal route.
 *
 * Students hold no permissions by design, because the portal question is not
 * "may you read applications?" but "may you read *this* one?" — ownership,
 * which permissions cannot express. Routes carrying this decorator MUST scope
 * their query through StudentScopeService; the decorator only opens the door.
 *
 * Opt-in rather than a blanket exemption: forgetting it makes a portal route
 * inaccessible, which is a visible bug, where the inverse would silently expose
 * every record.
 */
export const AllowStudent = () => SetMetadata(ALLOW_STUDENT_KEY, true)

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required?.length) return true

    const user = context.switchToHttp().getRequest<{ user?: JwtPayload }>().user
    if (!user) throw new ForbiddenException('Not authenticated.')

    // '*' is the Super Admin wildcard seeded in prisma/seed.ts.
    if (user.permissions.includes('*')) return true

    // Portal routes marked @AllowStudent() admit students, who hold no
    // permissions. Those routes narrow the query to the caller's own records
    // via StudentScopeService — this only gets them past the gate.
    const allowsStudent = this.reflector.getAllAndOverride<boolean>(ALLOW_STUDENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (allowsStudent && user.role === 'Student') return true

      const allowsAgent = this.reflector.getAllAndOverride<boolean>(ALLOW_AGENT_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
      if (allowsAgent && user.role === 'Agent') return true

    const missing = required.filter((p) => !user.permissions.includes(p))
    if (missing.length) {
      throw new ForbiddenException(`Missing permission: ${missing.join(', ')}`)
    }
    return true
  }
}
