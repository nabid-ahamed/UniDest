import { IsInt, IsOptional, IsString, MinLength } from 'class-validator'

/**
 * Query params arrive as strings — esbuild does not emit the decorator metadata
 * `@Type(() => Number)` relies on, so the service coerces with Number() itself.
 * See server/README.md.
 */
export class ListServicesDto {
  @IsOptional() @IsString() page?: string
  @IsOptional() @IsString() limit?: string
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() service?: string
  @IsOptional() @IsString() country?: string
  @IsOptional() @IsString() assignedTo?: string
  /** Staff-only filter; ignored for agents and students, who are auto-scoped. */
  @IsOptional() @IsString() studentNo?: string
}

export class CreateServiceDto {
  @IsString() @MinLength(1) studentNo!: string
  @IsString() @MinLength(1) service!: string
  @IsOptional() @IsString() country?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() assignedTo?: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateServiceDto {
  @IsOptional() @IsString() service?: string
  @IsOptional() @IsString() country?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() status?: string
  /** '' clears the assignee; omitted leaves it unchanged. */
  @IsOptional() @IsString() assignedTo?: string
  @IsOptional() @IsString() notes?: string
}

export class ReplyServiceDto {
  @IsString() @MinLength(1) body!: string
  @IsOptional() @IsInt() notifyId?: number
}
