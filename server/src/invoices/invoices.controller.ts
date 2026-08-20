import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { AllowStudent, RequirePermission } from '../auth/guards/permissions.guard'
import { StudentScopeService } from '../auth/student-scope.service'
import type { JwtPayload } from '../auth/auth.types'
import { InvoicesService } from './invoices.service'
import {
  CreateInvoiceDto,
  ListInvoicesDto,
  RecordPaymentDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto'

@Controller('invoices')
export class InvoicesController {
  constructor(
    @Inject(InvoicesService) private readonly invoices: InvoicesService,
    @Inject(StudentScopeService) private readonly scope: StudentScopeService,
  ) {}

  /**
   * Staff see every invoice; a student sees only their own.
   *
   * The student's own studentNo overrides whatever they send, so the portal
   * cannot page through anyone else's bills by guessing a value.
   */
  @Get()
  @RequirePermission('invoice')
  @AllowStudent()
  async list(@Query() query: ListInvoicesDto, @Req() req: { user?: JwtPayload }) {
    if (this.scope.isStudent(req.user)) {
      const studentId = await this.scope.requireStudentId(req.user!)
      const student = await this.invoices.studentNoFor(studentId)
      return this.invoices.list({ ...query, studentNo: student })
    }
    return this.invoices.list(query)
  }

  /** Billing entities for the issuer picker. Declared before ':id'. */
  @Get('businesses')
  @RequirePermission('invoice')
  businesses() {
    return this.invoices.businesses()
  }

  @Get('statuses')
  @RequirePermission('invoice')
  statuses() {
    return this.invoices.statuses()
  }

  @Get(':id')
  @RequirePermission('invoice')
  @AllowStudent()
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    await this.scope.assertOwnsInvoice(req.user, id)
    return this.invoices.get(id)
  }

  @Post()
  @RequirePermission('invoice')
  create(@Body() dto: CreateInvoiceDto, @Req() req: { user?: JwtPayload }) {
    return this.invoices.create(dto, req.user?.sub)
  }

  @Patch(':id')
  @RequirePermission('edit-invoice')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.invoices.update(id, dto, req.user?.sub)
  }

  /**
   * Record a payment (or a negative one, for a refund).
   *
   * Gated on `invoice` rather than `edit-invoice`: taking a payment is the
   * everyday act, whereas editing an issued invoice's amounts is not.
   */
  @Post(':id/payments')
  @RequirePermission('invoice')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.invoices.recordPayment(id, dto, req.user?.sub)
  }

  @Delete(':id')
  @RequirePermission('edit-invoice')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: JwtPayload }) {
    return this.invoices.remove(id, req.user?.sub)
  }
}
