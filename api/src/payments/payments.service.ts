import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Expense } from '../expenses/expense.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Expense)
    private expensesRepo: Repository<Expense>,
  ) {}

  async findByMonth(userId: string, year: number, month: number, workspaceId?: string): Promise<Payment[]> {
    const query = this.paymentsRepo
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.expense', 'expense')
      .leftJoinAndSelect('payment.paidBy', 'paidBy')
      .where('payment.year = :year', { year })
      .andWhere('payment.month = :month', { month });

    if (workspaceId) {
      query.andWhere('expense.workspace_id = :workspaceId', { workspaceId });
    } else {
      query.andWhere('expense.user_id = :userId', { userId });
    }

    return query.getMany();
  }

  async findByExpense(expenseId: string, year: number): Promise<Payment[]> {
    return this.paymentsRepo.find({
      where: { expenseId, year },
      order: { month: 'ASC' },
    });
  }

  async create(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    const expense = await this.expensesRepo.findOne({ where: { id: dto.expenseId } });
    if (!expense) throw new NotFoundException('Gasto no encontrado');

    const amountPaid = Number(dto.amountPaid);
    if (amountPaid <= 0) throw new BadRequestException('El monto pagado debe ser mayor a 0');

    // Query para obtener el total ya pagado este mes
    const result = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount_paid), 0)', 'total')
      .where('p.expense_id = :expenseId', { expenseId: dto.expenseId })
      .andWhere('p.year = :year', { year: dto.year })
      .andWhere('p.month = :month', { month: dto.month })
      .getRawOne();

    const currentTotal = parseFloat(result.total) || 0;
    const expenseAmount = Number(expense.amount);

    if (currentTotal + amountPaid > expenseAmount + 0.01) { // sum +0.01 per float precision
      throw new BadRequestException('La suma de pagos no puede exceder el monto total del gasto (' + expenseAmount + ')');
    }

    const payment = this.paymentsRepo.create({
      expenseId: dto.expenseId,
      year: dto.year,
      month: dto.month,
      amountPaid: amountPaid,
      paidById: userId,
      paidAt: new Date(),
    });

    return this.paymentsRepo.save(payment);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const payment = await this.paymentsRepo
      .createQueryBuilder('payment')
      .innerJoin('payment.expense', 'expense')
      .where('payment.id = :id', { id })
      .andWhere('(payment.paid_by_id = :userId OR expense.user_id = :userId)', { userId })
      .getOne();

    if (!payment) {
      throw new NotFoundException('Pago no encontrado o no tienes permiso para desmarcarlo');
    }

    await this.paymentsRepo.remove(payment);
    return { message: 'Pago desmarcado correctamente' };
  }
}
