import { IsIn, IsInt, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'

export class ListAgentsDto {
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsIn(['Active', 'Inactive']) status?: string
}

export class CreateAgentDto {
  @IsString() @MinLength(1) name!: string
  @IsOptional() @IsString() company?: string
  @IsOptional() @IsString() email?: string
  @IsOptional() @IsString() phone?: string
  /** Percent, e.g. 12.5. Stored as basis points. */
  @IsOptional() @IsNumber() commissionRate?: number
  @IsOptional() @IsIn(['Active', 'Inactive']) status?: string
}

export class UpdateAgentDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() company?: string
  @IsOptional() @IsString() email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsNumber() commissionRate?: number
  @IsOptional() @IsIn(['Active', 'Inactive']) status?: string
}

export class ListCommissionsDto {
  @IsOptional() @IsString() agentId?: string
  @IsOptional() @IsString() status?: string
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
