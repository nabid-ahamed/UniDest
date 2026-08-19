import { IsOptional, IsString } from 'class-validator'

export class ListApplicationsDto {
  @IsOptional() @IsString() page?: string
  @IsOptional() @IsString() limit?: string
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() assignedTo?: string
  /** Restrict to one student — used by the student detail page. */
  @IsOptional() @IsString() studentId?: string
}

export class CreateApplicationDto {
  /** Business key, not the numeric id — the UI works in student numbers. */
  @IsString() studentNo!: string

  @IsOptional() @IsString() course?: string
  @IsOptional() @IsString() intake?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() assignedTo?: string
  @IsOptional() @IsString() appliedThrough?: string
  @IsOptional() @IsString() agent?: string
  @IsOptional() @IsString() priority?: string
}

export class UpdateApplicationDto {
  @IsOptional() @IsString() course?: string
  @IsOptional() @IsString() intake?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() assignedTo?: string
  @IsOptional() @IsString() appliedThrough?: string
  @IsOptional() @IsString() agent?: string
  @IsOptional() @IsString() priority?: string
  /** Optional note recorded against the status change in the timeline. */
  @IsOptional() @IsString() note?: string
}
