import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Expense } from '../expenses/expense.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'expense_id' })
  expenseId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'datetime2', name: 'paid_at', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_paid' })
  amountPaid: number;

  @ManyToOne(() => Expense, (expense) => expense.payments)
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;
}
