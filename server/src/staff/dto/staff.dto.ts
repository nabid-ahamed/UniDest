import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class ListStaffDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() role?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() status?: string
}

export class CreateStaffDto {
  @IsString() @MinLength(1, { message: 'Name is required.' }) name!: string
  @IsEmail({}, { message: 'Enter a valid email.' }) email!: string
  @IsString() role!: string

  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() avatar?: string
  /** Omit to create an invited account that cannot sign in yet. */
  @IsOptional() @IsString() @MinLength(6) password?: string
}

export class UpdateStaffDto {
  @IsOptional() @IsString() @MinLength(1) name?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() role?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() avatar?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() @MinLength(6) password?: string
}
