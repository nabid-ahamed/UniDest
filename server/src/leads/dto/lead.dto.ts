import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'

/** Query params for GET /leads. */
export class ListLeadsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50

  /** Free-text match across name / email / phone. */
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  branch?: string

  @IsOptional()
  @IsString()
  assignedTo?: string

  /**
   * Converted leads are hidden by default: after a lead becomes a student its
   * row is kept for funnel reporting, but showing it in the working list would
   * duplicate the student. Pass 'true' for conversion-rate views.
   */
  @IsOptional()
  @IsString()
  includeConverted?: string
}

export class CreateLeadDto {
  @IsString()
  @MinLength(1, { message: 'Name is required.' })
  name!: string

  @IsOptional() @IsEmail({}, { message: 'Enter a valid email.' }) email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() phoneNote?: string
  @IsOptional() @IsBoolean() whatsapp?: boolean
  @IsOptional() @IsString() gender?: string
  @IsOptional() @IsString() source?: string
  @IsOptional() @IsString() studyLevel?: string
  @IsOptional() @IsString() qualification?: string
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]

  /** Labels, not ids — the UI works in the words a counsellor sees. */
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsString() assignedTo?: string
  @IsOptional() @IsString() countryInterested?: string

  @IsOptional() @IsDateString() nextFollowup?: string
}

/** Every field optional — PATCH applies only what is sent. */
export class UpdateLeadDto extends CreateLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  declare name: string
}
