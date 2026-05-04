import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './workspace.entity';
import { UserWorkspace } from './user-workspace.entity';
import { Expense } from '../expenses/expense.entity';
import { Payment } from '../payments/payment.entity';
import { User } from '../users/user.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, UserWorkspace, Expense, Payment, User])],
  providers: [WorkspacesService],
  controllers: [WorkspacesController],
  exports: [WorkspacesService]
})
export class WorkspacesModule {}

