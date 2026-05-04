import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { Payment } from '../payments/payment.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uniqueidentifier', name: 'workspace_id', nullable: true })
  workspaceId: string | null;

  @Column({ type: 'varchar', length: 20, name: 'split_type', default: 'INDIVIDUAL' })
  splitType: string; // 'EQUAL', 'INDIVIDUAL'

  @Column({ type: 'uniqueidentifier', name: 'assigned_user_id', nullable: true })
  assignedUserId: string | null;

  @Column({ type: 'uniqueidentifier', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  type: 'fixed' | 'variable';

  @Column({ type: 'int', name: 'due_day', nullable: true })
  dueDay: number | null;

  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'bit', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.expenses, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace, (workspace) => workspace.expenses, { nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: User;

  @ManyToOne(() => Category, (category) => category.expenses)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Payment, (payment) => payment.expense)
  payments: Payment[];
}
