import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'

export class ListAgentsDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsIn(['Active', 'Inactive']) status?: string
  @IsOptional() @IsString() branch?: string
  @IsOptional() @IsIn(['Small', 'Medium', 'Large']) category?: string
}

export class CreateAgentDto {
  @IsString() @MinLength(1) name!: string
  @IsOptional() @IsString() firstName?: string
  @IsOptional() @IsString() lastName?: string
  @IsOptional() @IsString() company?: string
  @IsOptional() @IsString() email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() country?: string
  @IsOptional() @IsString() state?: string
  @IsOptional() @IsString() city?: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsIn(['Small', 'Medium', 'Large']) category?: string
  @IsOptional() @IsInt() branchId?: number
  @IsOptional() @IsInt() pointOfContactId?: number
  @IsOptional() @IsString() logoUrl?: string
  @IsOptional() @IsString() idProofUrl?: string
  @IsOptional() @IsString() incorporationCertUrl?: string
  @IsOptional() @IsString() @MinLength(6) password?: string
  @IsOptional() @IsBoolean() canSubmitApplications?: boolean
  @IsOptional() @IsBoolean() autoConvertReferrals?: boolean
  /** Percent, e.g. 12.5. Stored as basis points. */
  @IsOptional() @IsNumber() commissionRate?: number
  @IsOptional() @IsIn(['Active', 'Inactive']) status?: string
}

export class UpdateAgentDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() company?: string
  @IsOptional() @IsString() email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() firstName?: string
  @IsOptional() @IsString() lastName?: string
  @IsOptional() @IsString() country?: string
  @IsOptional() @IsString() state?: string
  @IsOptional() @IsString() city?: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsIn(['Small', 'Medium', 'Large']) category?: string
  @IsOptional() @IsInt() branchId?: number
  @IsOptional() @IsInt() pointOfContactId?: number
  @IsOptional() @IsString() logoUrl?: string
  @IsOptional() @IsString() idProofUrl?: string
  @IsOptional() @IsString() incorporationCertUrl?: string
  @IsOptional() @IsString() @MinLength(6) password?: string
  @IsOptional() @IsBoolean() canSubmitApplications?: boolean
  @IsOptional() @IsBoolean() autoConvertReferrals?: boolean
  @IsOptional() @IsNumber() commissionRate?: number
  @IsOptional() @IsIn(['Active', 'Inactive']) status?: string
}

export class UpdateSubmissionSettingDto {
  @IsBoolean() enabled!: boolean
}

export class ListCommissionsDto {
  @IsOptional() @IsString() agentId?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() from?: string
  @IsOptional() @IsString() to?: string
}

export class ListReferralsDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() agentId?: string
}

export class CreateCommissionDto {
  @IsInt() agentId!: number
  @IsInt() applicationId!: number
  /** Either an explicit amount, or a baseAmount the agent's rate applies to. */
  @IsOptional() @IsNumber() amount?: number
  @IsOptional() @IsNumber() baseAmount?: number
  @IsOptional() @IsString() currency?: string
  @IsOptional() @IsString() note?: string
}

export class UpdateCommissionDto {
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() paidAt?: string
  @IsOptional() @IsString() note?: string
}
