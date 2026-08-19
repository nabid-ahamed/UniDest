import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import argon2 from 'argon2'
import { PrismaService } from '../prisma/prisma.service'
import { toUiRole, type AuthUserDto, type JwtPayload } from './auth.types'

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  /**
   * Verify credentials and issue a token pair.
   *
   * Both the "no such user" and "wrong password" paths return the SAME error.
   * Distinguishing them would let an attacker enumerate which email addresses
   * have accounts.
   */
  async login(email: string, password: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
      include: { role: true },
    })

    if (!user || user.status === 'disabled') {
      throw new UnauthorizedException('Invalid email or password.')
    }

    const passwordOk = await argon2.verify(user.passwordHash, password)
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const permissions = Array.isArray(user.role.permissions)
      ? (user.role.permissions as string[])
      : []

    const payload: JwtPayload = {
      sub: user.publicId,
      email: user.email,
      role: toUiRole(user.role.name),
      tenantId: Number(user.tenantId),
      permissions,
    }

    return {
      ...(await this.issueTokens(payload)),
      user: this.toAuthUser(user, permissions),
    }
  }

  /**
   * Exchange a refresh token for a new pair. The user is re-read from the
   * database rather than trusted from the old token, so a disabled account or
   * a changed role takes effect on the next refresh instead of lingering for
   * the token's whole lifetime.
   */
  async refresh(refreshToken: string) {
    let decoded: JwtPayload
    try {
      decoded = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      })
    } catch {
      throw new UnauthorizedException('Session expired. Please sign in again.')
    }

    const user = await this.prisma.client.user.findFirst({
      where: { publicId: decoded.sub, deletedAt: null },
      include: { role: true },
    })
    if (!user || user.status === 'disabled') {
      throw new UnauthorizedException('Session expired. Please sign in again.')
    }

    const permissions = Array.isArray(user.role.permissions)
      ? (user.role.permissions as string[])
      : []

    const payload: JwtPayload = {
      sub: user.publicId,
      email: user.email,
      role: toUiRole(user.role.name),
      tenantId: Number(user.tenantId),
      permissions,
    }

    return {
      ...(await this.issueTokens(payload)),
      user: this.toAuthUser(user, permissions),
    }
  }

  /** Resolve the signed-in user for GET /auth/me. */
  async me(publicId: string): Promise<AuthUserDto> {
    const user = await this.prisma.client.user.findFirst({
      where: { publicId, deletedAt: null },
      include: { role: true },
    })
    if (!user) throw new UnauthorizedException()

    const permissions = Array.isArray(user.role.permissions)
      ? (user.role.permissions as string[])
      : []
    return this.toAuthUser(user, permissions)
  }

  /**
   * Short-lived access token + long-lived refresh token. If an access token
   * leaks it is useless within minutes; the refresh token is sent rarely, so
   * it is exposed far less often.
   */
  private async issueTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        // Cast: jsonwebtoken types a duration as a `StringValue` template
        // literal ("15m", "7d", …), which a plain env string can't satisfy.
        expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as `${number}m`,
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as `${number}d`,
      }),
    ])
    return { accessToken, refreshToken }
  }

  /** Never let passwordHash escape into a response. */
  private toAuthUser(
    user: { publicId: string; name: string; email: string; phone: string | null; avatarUrl: string | null; role: { name: string } },
    permissions: string[],
  ): AuthUserDto {
    return {
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      role: toUiRole(user.role.name),
      phone: user.phone,
      avatar: user.avatarUrl,
      permissions,
    }
  }
}
