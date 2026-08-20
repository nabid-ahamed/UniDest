import { Type } from 'class-transformer'
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator'

const METHODS = ['Cash', 'Card', 'Bank Transfer', 'Online', 'Cheque']

export class InvoiceItemDto {
  @IsString() @MinLength(1) description!: string
  /** Major units (1250.50). Stored as integer minor units server-side. */
  @IsNumber() amount!: number
}

export class ListInvoicesDto {
  @IsOptional() @IsString() page?: string
  @IsOptional() @IsString() limit?: string
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() studentNo?: string
  /** 'student' | 'university' — university invoices carry an application. */
  @IsOptional() @IsIn(['student', 'university']) kind?: string
}

export class CreateInvoiceDto {
  @IsString() studentNo!: string
  @IsOptional() @IsString() invoiceNo?: string
  @IsOptional() @IsInt() businessId?: number
  @IsOptional() @IsInt() applicationId?: number
  @IsOptional() @IsString() currency?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[]

  @IsOptional() @IsNumber() discount?: number
  @IsOptional() @IsString() dueDate?: string
  @IsOptional() @IsString() paymentLabel?: string
  @IsOptional() @IsString() agent?: string
  @IsOptional() @IsString() terms?: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateInvoiceDto {
  /** Replaces every line item when present; omitted leaves them untouched. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[]

  @IsOptional() @IsNumber() discount?: number
  @IsOptional() @IsString() currency?: string
  @IsOptional() @IsString() dueDate?: string
  @IsOptional() @IsString() paymentLabel?: string
  @IsOptional() @IsString() agent?: string
  @IsOptional() @IsString() terms?: string
  @IsOptional() @IsString() notes?: string
}

export class RecordPaymentDto {
  /** Negative records a refund — the ledger is append-only. */
  @IsNumber() amount!: number
  @IsOptional() @IsIn(METHODS) method?: string
  @IsOptional() @IsString() note?: string
  @IsOptional() @IsString() paidAt?: string
}
