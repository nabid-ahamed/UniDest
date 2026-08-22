import { IsArray, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator'

export class ListStudentsDto {
  @IsOptional() @IsString() page?: string
  @IsOptional() @IsString() limit?: string
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() assignedTo?: string
  /** Internal server-side scope; client values are overridden for agents. */
  @IsOptional() @IsString() agentId?: string

  /** 'active' (default) | 'archived' | 'deleted' — mirrors the UI's three tabs. */
  @IsOptional() @IsString() view?: string
}

export class CreateStudentDto {
  @IsString()
  @MinLength(1, { message: 'Name is required.' })
  name!: string

  @IsOptional() @IsEmail({}, { message: 'Enter a valid email.' }) email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() phoneNote?: string
  @IsOptional() @IsString() gender?: string
  @IsOptional() @IsString() source?: string

  /** Labels, not ids — the UI works in the words a counsellor sees. */
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() assignedTo?: string
  @IsOptional() @IsString() countryOfResidence?: string
  @IsOptional() @IsString() countryInterested?: string

  @IsOptional() @IsString() studyLevel?: string
  @IsOptional() @IsString() course?: string
  @IsOptional() @IsString() intake?: string
  @IsOptional() @IsString() university?: string
  @IsOptional() @IsString() avatar?: string
}

export class UpdateStudentDto extends CreateStudentDto {
  @IsOptional() @IsString() @MinLength(1) declare name: string
  /** 'active' | 'archived' | 'deleted' — drives archive/restore/trash actions. */
  @IsOptional() @IsString() state?: string
}

/** Body for POST /leads/:id/convert. */
export class ConvertLeadDto {
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() assignedTo?: string
  @IsOptional() @IsString() course?: string
  @IsOptional() @IsString() intake?: string
  @IsOptional() @IsString() university?: string
}

/** Bulk archive/delete/restore, used by the students list toolbar. */
export class BulkStudentsDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[]
}
