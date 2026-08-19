import { Body, Controller, Get, HttpCode, Inject, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import type { JwtPayload } from './auth.types'
import { LoginDto, RefreshDto } from './dto/login.dto'
import { Public } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  /** Public: you cannot present a token before you have one. */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }

  /** Public: the refresh token itself is the credential, verified in the service. */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  /** Requires a valid access token — the global JwtAuthGuard enforces it. */
  @Get('me')
  me(@Req() req: { user: JwtPayload }) {
    return this.auth.me(req.user.sub)
  }

  /**
   * Stateless logout: with JWT there is no server session to destroy, so the
   * client simply discards its tokens. Kept as an endpoint so the frontend has
   * something to call, and so token revocation can be added here later
   * (a denylist in Redis) without changing the client.
   */
  @Post('logout')
  @HttpCode(200)
  logout() {
    return { ok: true }
  }
}
