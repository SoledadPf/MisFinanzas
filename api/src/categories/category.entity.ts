import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Expense } from '../expenses/expense.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'uniqueidentifier', name: 'workspace_id', nullable: true })
  workspaceId: string | null;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'nvarchar', length: 20, default: '📦' })
  icon: string;

  @Column({ type: 'varchar', length: 7, default: '#7F8C8D' })
  color: string;

  @ManyToOne(() => User, (user) => user.categories, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace, (workspace) => workspace.categories, { nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}
