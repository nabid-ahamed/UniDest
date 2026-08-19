import { ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Marks a route as reachable without a token (login, refresh, health).
 *
 * The guard is registered GLOBALLY, so protection is the default and this
 * decorator is the deliberate exception. That direction matters: forgetting it
 * makes an endpoint unreachable — loud and obvious — rather than silently open.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // @Inject is explicit because tsx/esbuild does not emit decorator metadata,
  // so Nest cannot infer this dependency from the type annotation alone.
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true
    return super.canActivate(context)
  }
}
