import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { WorkspacesService } from '../../../core/services/workspaces.service';
import { WorkspaceModalComponent } from '../workspace-modal/workspace-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, FormsModule, WorkspaceModalComponent],
  template: `
    <header class="topbar">
      <!-- Logo -->
      <a class="logo" routerLink="/dashboard">
        <div class="logo-icon">💰</div>
        <span class="logo-text">MisFinanzas</span>
        <span class="beta-badge">BETA</span>
      </a>

      <!-- Navigation links -->
      <nav class="top-nav">
        <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
          <mat-icon>dashboard</mat-icon>
          <span>Dashboard</span>
        </a>
        <a class="nav-link" routerLink="/expenses" routerLinkActive="active">
          <mat-icon>receipt_long</mat-icon>
          <span>Gastos</span>
        </a>
        <a class="nav-link" routerLink="/calendar" routerLinkActive="active">
          <mat-icon>calendar_month</mat-icon>
          <span>Calendario</span>
        </a>
        <a class="nav-link" routerLink="/balances" routerLinkActive="active">
          <mat-icon>balance</mat-icon>
          <span>Saldos</span>
        </a>
      </nav>

      <!-- User & Workspace -->
      <div class="top-actions">
        <!-- Selector de Grupos -->
        @if (workspacesService.workspaces().length > 0) {
          <div class="workspace-selector">
            <mat-icon>group</mat-icon>
            <select [ngModel]="workspacesService.activeWorkspace()?.id"
                    (ngModelChange)="onWorkspaceChange($event)" class="workspace-select"
                    id="workspace-select">
              @for (uw of workspacesService.workspaces(); track uw.workspaceId) {
                <option [value]="uw.workspaceId">{{ uw.workspace.name }}</option>
              }
            </select>
            <!-- Botón para gestionar el grupo activo -->
            <button class="manage-btn" id="manage-workspace-btn" 
                    (click)="openManageModal()"
                    title="Gestionar grupo / Invitar miembros">
              <mat-icon>settings</mat-icon>
            </button>
            <!-- Botón para crear nuevo grupo -->
            <button class="manage-btn create-new-btn" id="create-new-workspace-btn"
                    (click)="openCreateModal()"
                    title="Crear nuevo grupo">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        } @else {
          <button class="new-workspace-btn" id="create-workspace-btn" (click)="openCreateModal()">
            <mat-icon>add</mat-icon> Crear Grupo
          </button>
        }

        <div class="user-avatar">{{ auth.user()?.name?.charAt(0)?.toUpperCase() }}</div>
        <button class="logout-btn" (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </header>

    <!-- Modal de creación / gestión de grupos -->
    @if (showModal()) {
      <app-workspace-modal
        [mode]="modalMode()"
        [workspaceId]="activeWorkspaceId()"
        (close)="closeModal()"
        (workspaceCreated)="onWorkspaceCreated()"
      />
    }
  `,
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  showModal = signal(false);
  modalMode = signal<'create' | 'manage'>('create');
  activeWorkspaceId = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    public workspacesService: WorkspacesService
  ) {}

  ngOnInit() {
    this.workspacesService.loadWorkspaces().subscribe();
  }

  onWorkspaceChange(workspaceId: string) {
    const uw = this.workspacesService.workspaces().find(w => w.workspaceId === workspaceId);
    if (uw) {
      this.workspacesService.setActiveWorkspace(uw.workspace);
    }
  }

  openCreateModal() {
    this.modalMode.set('create');
    this.activeWorkspaceId.set(null);
    this.showModal.set(true);
  }

  openManageModal() {
    const active = this.workspacesService.activeWorkspace();
    if (active) {
      this.modalMode.set('manage');
      this.activeWorkspaceId.set(active.id);
      this.showModal.set(true);
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  onWorkspaceCreated() {
    // La workspace ya fue recargada en workspacesService.createWorkspace()
  }
}
