import { Controller, Post, Get, Delete, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  createWorkspace(@Request() req, @Body('name') name: string) {
    return this.workspacesService.createWorkspace(req.user.userId, name);
  }

  @Get()
  getUserWorkspaces(@Request() req) {
    return this.workspacesService.getUserWorkspaces(req.user.userId);
  }

  // Ver info del workspace por token (para la página /join, sin requerir ser miembro)
  @Get('invite-info')
  getWorkspaceByToken(@Query('token') token: string) {
    return this.workspacesService.getWorkspaceByToken(token);
  }

  // Genera o regenera el link de invitación para un workspace
  @Post(':id/invite/generate')
  generateInvite(@Param('id') id: string) {
    return this.workspacesService.generateInviteToken(id);
  }

  // Revoca el link de invitación
  @Delete(':id/invite')
  revokeInvite(@Param('id') id: string) {
    return this.workspacesService.revokeInviteToken(id);
  }

  // El usuario logueado se une por token
  @Post('join')
  joinByToken(@Request() req, @Body('token') token: string) {
    return this.workspacesService.joinByToken(req.user.userId, token);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.workspacesService.getMembers(id);
  }

  @Get(':id/balances')
  getBalances(
    @Param('id') id: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.workspacesService.getBalances(id, month, year);
  }
}

