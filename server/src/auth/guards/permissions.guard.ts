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

    const missing = required.filter((p) => !user.permissions.includes(p))
    if (missing.length) {
      throw new ForbiddenException(`Missing permission: ${missing.join(', ')}`)
    }
    return true
  }
}
