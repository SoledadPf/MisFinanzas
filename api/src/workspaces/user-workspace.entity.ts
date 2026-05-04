import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Workspace } from './workspace.entity';

@Entity('user_workspaces')
export class UserWorkspace {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('uuid', { name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => User, (user) => user.userWorkspaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace, (workspace) => workspace.userWorkspaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role: string; // 'admin' | 'member' 

  @Column({ type: 'bit', default: false })
  isAccepted: boolean; // false = Pending invitation

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
