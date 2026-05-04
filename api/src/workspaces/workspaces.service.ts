import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';
import { UserWorkspace } from './user-workspace.entity';
import { Expense } from '../expenses/expense.entity';
import { Payment } from '../payments/payment.entity';
import { User } from '../users/user.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepo: Repository<UserWorkspace>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createWorkspace(userId: string, name: string): Promise<Workspace> {
    const workspace = this.workspaceRepo.create({ name });
    const savedWorkspace = await this.workspaceRepo.save(workspace);

    const userWorkspace = this.userWorkspaceRepo.create({
      userId,
      workspaceId: savedWorkspace.id,
      role: 'admin',
      isAccepted: true,
    });
    await this.userWorkspaceRepo.save(userWorkspace);

    return savedWorkspace;
  }

  async getUserWorkspaces(userId: string) {
    return this.userWorkspaceRepo.find({
      where: { userId },
      relations: ['workspace'],
    });
  }

  // Genera (o regenera) el token de invitación y lo retorna
  async generateInviteToken(workspaceId: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace no encontrado');

    workspace.inviteToken = randomUUID();
    await this.workspaceRepo.save(workspace);

    return { token: workspace.inviteToken, workspaceId: workspace.id };
  }

  // Revoca el token (lo borra) para que el link deje de funcionar
  async revokeInviteToken(workspaceId: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace no encontrado');

    workspace.inviteToken = null;
    await this.workspaceRepo.save(workspace);

    return { message: 'Invitación revocada' };
  }

  // El usuario invitado llama this con su userId y el token del link
  async joinByToken(userId: string, token: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { inviteToken: token } });
    if (!workspace) throw new NotFoundException('El link de invitación no es válido o ya expiró');

    // Verificar que el usuario no sea ya miembro
    const existing = await this.userWorkspaceRepo.findOne({
      where: { userId, workspaceId: workspace.id },
    });
    if (existing) throw new ConflictException('Ya eres miembro de este grupo');

    const userWorkspace = this.userWorkspaceRepo.create({
      userId,
      workspaceId: workspace.id,
      role: 'member',
      isAccepted: true,
    });
    await this.userWorkspaceRepo.save(userWorkspace);

    return { message: 'Te uniste al grupo exitosamente', workspace };
  }

  // Para mostrar info del workspace en la página /join (sin requerir auth de miembro)
  async getWorkspaceByToken(token: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { inviteToken: token } });
    if (!workspace) throw new NotFoundException('El link de invitación no es válido o ya expiró');
    return { id: workspace.id, name: workspace.name };
  }

  async getMembers(workspaceId: string) {
    const userWorkspaces = await this.userWorkspaceRepo.find({
      where: { workspaceId, isAccepted: true },
      relations: ['user'],
    });
    return userWorkspaces.map(uw => ({
      id: uw.user.id,
      name: uw.user.name,
      email: uw.user.email,
      role: uw.role
    }));
  }

  // --- LOGICA DE CÁLCULO DE SALDOS (CUENTAS CLARAS) ---
  
  async getBalances(workspaceId: string, month: number, year: number) {
    // 1. Obtener todos los miembros del workspace
    const members = await this.userWorkspaceRepo.find({
      where: { workspaceId, isAccepted: true },
    });

    if (!members.length) return [];

    const memberCount = members.length;
    
    // Diccionarios para acumular
    const userTokens: Record<string, { oughtToPay: number; actuallyPaid: number; balance: number }> = {};
    for (const member of members) {
      userTokens[member.userId] = { oughtToPay: 0, actuallyPaid: 0, balance: 0 };
    }

    const payments = await this.paymentRepo.find({
      where: { year, month, expense: { workspaceId } },
      relations: ['expense'],
    });

    for (const payment of payments) {
      const exp = payment.expense;
      const amountPaid = Number(payment.amountPaid);
      const paidById = payment.paidById || exp.userId;

      if (paidById && userTokens[paidById]) {
        userTokens[paidById].actuallyPaid += amountPaid;
      }

      if (exp.splitType === 'EQUAL') {
        const splitAmount = amountPaid / memberCount;
        for (const member of members) {
          userTokens[member.userId].oughtToPay += splitAmount;
        }
      } else if (exp.splitType === 'INDIVIDUAL' && exp.assignedUserId) {
        if (userTokens[exp.assignedUserId]) {
          userTokens[exp.assignedUserId].oughtToPay += amountPaid;
        }
      } else {
        const defaultDue = exp.assignedUserId || exp.userId;
        if (defaultDue && userTokens[defaultDue]) {
          userTokens[defaultDue].oughtToPay += amountPaid;
        }
      }
    }

    const balancesArray = Object.keys(userTokens).map((userId) => {
      const user = userTokens[userId];
      user.balance = user.actuallyPaid - user.oughtToPay;
      return {
        userId,
        ...user,
      };
    });

    return balancesArray;
  }
}

