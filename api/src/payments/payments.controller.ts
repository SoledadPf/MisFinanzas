/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  findByMonth(
    @Request() req,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.paymentsService.findByMonth(
      req.user.userId,
      parseInt(year),
      parseInt(month),
      workspaceId,
    );
  }

  @Get('expense/:expenseId')
  findByExpense(
    @Param('expenseId') expenseId: string,
    @Query('year') year: string,
  ) {
    return this.paymentsService.findByExpense(expenseId, parseInt(year));
  }

  @Post()
  create(@Request() req, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.paymentsService.remove(id, req.user.userId);
  }
}
