import { IsEmail, IsString, MinLength } from 'class-validator'

/**
 * Validated by the global ValidationPipe before the controller runs, so the
 * service never sees a malformed body. `whitelist: true` also strips any extra
 * properties a caller tries to smuggle in.
 */
export class LoginDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  email!: string

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password!: string
}

export class RefreshDto {
  @IsString()
  refreshToken!: string
}
