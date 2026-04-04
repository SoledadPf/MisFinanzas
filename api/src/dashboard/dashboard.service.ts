import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expenses/expense.entity';
import { Payment } from '../payments/payment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepo: Repository<Expense>,
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
  ) {}

  async getSummary(userId: string, year: number, month: number) {
    // Total gastos fijos
    const fixedExpenses = await this.expensesRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.type = :type', { type: 'fixed' })
      .andWhere('e.is_active = 1')
      .getRawOne();

    // Total gastos variables del mes
    const variableExpenses = await this.expensesRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.type = :type', { type: 'variable' })
      .andWhere('e.is_active = 1')
      .andWhere('MONTH(e.date) = :month', { month })
      .andWhere('YEAR(e.date) = :year', { year })
      .getRawOne();

    // Total pagado este mes
    const paidTotal = await this.paymentsRepo
      .createQueryBuilder('p')
      .innerJoin('p.expense', 'e')
      .select('COALESCE(SUM(p.amount_paid), 0)', 'total')
      .where('e.user_id = :userId', { userId })
      .andWhere('p.year = :year', { year })
      .andWhere('p.month = :month', { month })
      .getRawOne();

    const totalFixed = parseFloat(fixedExpenses.total) || 0;
    const totalVariable = parseFloat(variableExpenses.total) || 0;
    const totalPaid = parseFloat(paidTotal.total) || 0;

    return {
      totalFixed,
      totalVariable,
      totalMonth: totalFixed + totalVariable,
      totalPaid,
      totalPending: totalFixed - totalPaid,
      month,
      year,
    };
  }

  async getByCategory(userId: string, year: number, month: number) {
    const result = await this.expensesRepo
      .createQueryBuilder('e')
      .innerJoin('e.category', 'c')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('c.icon', 'icon')
      .addSelect('c.color', 'color')
      .addSelect('SUM(e.amount)', 'total')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.is_active = 1')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.icon')
      .addGroupBy('c.color')
      .orderBy('total', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      ...r,
      total: parseFloat(r.total) || 0,
    }));
  }

  async getTrend(userId: string, year: number) {
    // Gastos fijos (mismo monto cada mes)
    const fixedTotal = await this.expensesRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.type = :type', { type: 'fixed' })
      .andWhere('e.is_active = 1')
      .getRawOne();

    const monthlyFixed = parseFloat(fixedTotal.total) || 0;

    // Gastos variables por mes
    const variableByMonth = await this.expensesRepo
      .createQueryBuilder('e')
      .select('MONTH(e.date)', 'month')
      .addSelect('SUM(e.amount)', 'total')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.type = :type', { type: 'variable' })
      .andWhere('e.is_active = 1')
      .andWhere('YEAR(e.date) = :year', { year })
      .groupBy('MONTH(e.date)')
      .getRawMany();

    const variableMap = new Map<number, number>();
    variableByMonth.forEach((v) => {
      variableMap.set(v.month, parseFloat(v.total) || 0);
    });

    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];

    return months.map((name, i) => {
      const variable = variableMap.get(i + 1) || 0;
      return {
        name,
        month: i + 1,
        fixed: monthlyFixed,
        variable,
        total: monthlyFixed + variable,
      };
    });
  }

  async getUpcomingPayments(userId: string, year: number, month: number) {
    // Gastos fijos que NO tienen pago este mes
    const allFixed = await this.expensesRepo.find({
      where: { userId, type: 'fixed', isActive: true },
      relations: ['category'],
      order: { dueDay: 'ASC' },
    });

    const paidThisMonth = await this.paymentsRepo
      .createQueryBuilder('p')
      .innerJoin('p.expense', 'e')
      .select('p.expense_id', 'expenseId')
      .where('e.user_id = :userId', { userId })
      .andWhere('p.year = :year', { year })
      .andWhere('p.month = :month', { month })
      .getRawMany();

    const paidIds = new Set(paidThisMonth.map((p) => p.expenseId));

    return allFixed
      .filter((e) => !paidIds.has(e.id))
      .map((e) => ({
        id: e.id,
        name: e.name,
        amount: e.amount,
        dueDay: e.dueDay,
        category: e.category,
      }));
  }
}
