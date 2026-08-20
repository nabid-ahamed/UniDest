import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator'

const AUDIENCES = ['Student', 'Agent', 'Student / Agent']
const KINDS = ['post', 'page', 'country']
const STATUSES = ['Draft', 'Published']

export class CreateWebinarDto {
  @IsString() @MinLength(1) topic!: string
  /** ISO datetime. */
  @IsString() startsAt!: string
  @IsOptional() @IsString() venue?: string
  @IsOptional() @IsIn(AUDIENCES) audienceType?: string
  @IsOptional() @IsString() webinarLink?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() notifiedEmail?: string
}

export class UpdateWebinarDto {
  @IsOptional() @IsString() topic?: string
  @IsOptional() @IsString() startsAt?: string
  @IsOptional() @IsString() venue?: string
  @IsOptional() @IsIn(AUDIENCES) audienceType?: string
  @IsOptional() @IsString() webinarLink?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() notifiedEmail?: string
}

export class EnrollWebinarDto {
  @IsString() @MinLength(1) name!: string
  @IsString() @MinLength(3) email!: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsIn(['Student', 'Agent']) userType?: string
}

export class CreateCmsDto {
  @IsIn(KINDS) kind!: string
  @IsString() @MinLength(1) title!: string
  @IsOptional() @IsString() slug?: string
  @IsOptional() @IsString() excerpt?: string
  @IsOptional() @IsString() body?: string
  @IsOptional() @IsString() coverUrl?: string
  @IsOptional() @IsIn(STATUSES) status?: string
  @IsOptional() @IsBoolean() featured?: boolean
  @IsOptional() @IsObject() meta?: Record<string, unknown>
}

export class UpdateCmsDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() slug?: string
  @IsOptional() @IsString() excerpt?: string
  @IsOptional() @IsString() body?: string
  @IsOptional() @IsString() coverUrl?: string
  @IsOptional() @IsIn(STATUSES) status?: string
  @IsOptional() @IsBoolean() featured?: boolean
  @IsOptional() @IsObject() meta?: Record<string, unknown>
}

export class SubscribeDto {
  @IsString() @MinLength(3) email!: string
  @IsOptional() @IsString() name?: string
}
