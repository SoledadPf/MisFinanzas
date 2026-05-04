import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepo: Repository<Expense>,
  ) {}

  async findAll(userId: string, type?: string, workspaceId?: string): Promise<Expense[]> {
    const query = this.expensesRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.is_active = 1');

    if (workspaceId) {
      query.andWhere('expense.workspace_id = :workspaceId', { workspaceId });
    } else {
      query.andWhere('expense.user_id = :userId', { userId });
    }

    if (type) {
      query.andWhere('expense.type = :type', { type });
    }

    return query.orderBy('expense.name', 'ASC').getMany();
  }

  async findById(id: string, userId: string): Promise<Expense> {
    const expense = await this.expensesRepo.findOne({
      where: { id, isActive: true },
      relations: ['category', 'payments'],
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    // Permitir acceso si el usuario es el creador, o si el gasto pertenece a un grupo
    if (expense.userId !== userId && !expense.workspaceId) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return expense;
  }

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expensesRepo.create({
      userId,
      categoryId: dto.categoryId,
      name: dto.name,
      amount: dto.amount,
      type: dto.type,
      dueDay: dto.dueDay || null,
      date: dto.date || null,
      notes: dto.notes || null,
      workspaceId: dto.workspaceId || null,
      splitType: dto.splitType || 'INDIVIDUAL',
      assignedUserId: dto.assignedUserId || null,
    });

    return this.expensesRepo.save(expense);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findById(id, userId);

    Object.assign(expense, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.dueDay !== undefined && { dueDay: dto.dueDay }),
      ...(dto.date !== undefined && { date: dto.date }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.workspaceId !== undefined && { workspaceId: dto.workspaceId || null }),
      ...(dto.splitType !== undefined && { splitType: dto.splitType }),
      ...(dto.assignedUserId !== undefined && { assignedUserId: dto.assignedUserId || null }),
    });

    await this.expensesRepo.save(expense);
    return this.findById(id, userId);
  }


  async remove(id: string, userId: string): Promise<{ message: string }> {
    const expense = await this.findById(id, userId);
    expense.isActive = false;
    await this.expensesRepo.save(expense);
    return { message: 'Gasto eliminado correctamente' };
  }
}
