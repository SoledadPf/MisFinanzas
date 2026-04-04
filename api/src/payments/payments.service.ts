import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
  ) {}

  async findByMonth(userId: string, year: number, month: number): Promise<Payment[]> {
    return this.paymentsRepo
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.expense', 'expense')
      .where('expense.user_id = :userId', { userId })
      .andWhere('payment.year = :year', { year })
      .andWhere('payment.month = :month', { month })
      .getMany();
  }

  async findByExpense(expenseId: string, year: number): Promise<Payment[]> {
    return this.paymentsRepo.find({
      where: { expenseId, year },
      order: { month: 'ASC' },
    });
  }

  async create(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    // Verificar que no exista ya un pago para ese mes
    const existing = await this.paymentsRepo.findOne({
      where: {
        expenseId: dto.expenseId,
        year: dto.year,
        month: dto.month,
      },
    });

    if (existing) {
      throw new ConflictException('Este gasto ya fue marcado como pagado para este mes');
    }

    const payment = this.paymentsRepo.create({
      expenseId: dto.expenseId,
      year: dto.year,
      month: dto.month,
      amountPaid: dto.amountPaid,
      paidAt: new Date(),
    });

    return this.paymentsRepo.save(payment);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const payment = await this.paymentsRepo
      .createQueryBuilder('payment')
      .innerJoin('payment.expense', 'expense')
      .where('payment.id = :id', { id })
      .andWhere('expense.user_id = :userId', { userId })
      .getOne();

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    await this.paymentsRepo.remove(payment);
    return { message: 'Pago desmarcado correctamente' };
  }
}
