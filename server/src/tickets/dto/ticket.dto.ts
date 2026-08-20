import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator'

const PRIORITIES = ['High', 'Medium', 'Low']

/**
 * Query params arrive as strings — esbuild does not emit the decorator metadata
 * `@Type(() => Number)` relies on, so the service coerces with Number() itself.
 * See server/README.md.
 */
export class ListTicketsDto {
  @IsOptional() @IsString() page?: string
  @IsOptional() @IsString() limit?: string
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() priority?: string
  @IsOptional() @IsString() category?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() assignedTo?: string
}

export class CreateTicketDto {
  @IsString() @MinLength(1) subject!: string
  @IsOptional() @IsString() category?: string
  /** Exactly one of studentNo / leadId — enforced in the service. */
  @IsOptional() @IsString() studentNo?: string
  @IsOptional() @IsInt() leadId?: number
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsIn(PRIORITIES) priority?: string
  @IsOptional() @IsString() assignedTo?: string
  /** Optional opening message from the requester. */
  @IsOptional() @IsString() body?: string
}

export class UpdateTicketDto {
  @IsOptional() @IsString() subject?: string
  @IsOptional() @IsString() category?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsIn(PRIORITIES) priority?: string
  /** '' clears the assignee; omitted leaves it unchanged. */
  @IsOptional() @IsString() assignedTo?: string
}

export class ReplyTicketDto {
  @IsString() @MinLength(1) body!: string
}
