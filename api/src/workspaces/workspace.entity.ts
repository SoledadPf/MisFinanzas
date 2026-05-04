import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserWorkspace } from './user-workspace.entity';
import { Expense } from '../expenses/expense.entity';
import { Category } from '../categories/category.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'invite_token' })
  inviteToken: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserWorkspace, (userWorkspace) => userWorkspace.workspace)
  userWorkspaces: UserWorkspace[];

  @OneToMany(() => Expense, (expense) => expense.workspace)
  expenses: Expense[];

  @OneToMany(() => Category, (category) => category.workspace)
  categories: Category[];
}
