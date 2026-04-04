import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Expense } from '../expenses/expense.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'nvarchar', length: 20, default: '📦' })
  icon: string;

  @Column({ type: 'varchar', length: 7, default: '#7F8C8D' })
  color: string;

  @ManyToOne(() => User, (user) => user.categories, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}
