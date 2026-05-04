import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WorkspacesService, Workspace, WorkspaceMember } from '../../../core/services/workspaces.service';
import { environment } from '../../../../environments/environment';

type ModalStep = 'create' | 'invite' | 'members';

@Component({
  selector: 'app-workspace-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-card" id="workspace-modal">

        <!-- HEADER -->
        <div class="modal-header">
          <div class="modal-title-row">
            @if (step() === 'create') {
              <mat-icon class="modal-icon">group_add</mat-icon>
              <h2>Crear nuevo grupo</h2>
            } @else if (step() === 'invite') {
              <mat-icon class="modal-icon success">check_circle</mat-icon>
              <h2>{{ createdWorkspaceName }}</h2>
            } @else {
              <mat-icon class="modal-icon">people</mat-icon>
              <h2>Miembros del grupo</h2>
            }
          </div>
          <button class="close-btn" id="close-workspace-modal" (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- STEP: CREATE -->
        @if (step() === 'create') {
          <div class="modal-body">
            <p class="modal-subtitle">Crea un grupo compartido para llevar las cuentas juntos</p>
            <div class="field-group">
              <label for="workspace-name-input">Nombre del grupo</label>
              <input
                id="workspace-name-input"
                type="text"
                [(ngModel)]="workspaceName"
                placeholder="Ej: Hogar, Viaje a Lima, Depa..."
                class="text-input"
                (keyup.enter)="createGroup()"
                autofocus
              />
            </div>
            @if (errorMsg()) {
              <p class="error-msg">{{ errorMsg() }}</p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="close.emit()">Cancelar</button>
            <button class="btn-primary" id="create-group-btn" (click)="createGroup()" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> } @else { <mat-icon>add</mat-icon> }
              Crear grupo
            </button>
          </div>
        }

        <!-- STEP: INVITE -->
        @if (step() === 'invite') {
          <div class="modal-body">
            <div class="success-banner">
              <mat-icon>celebration</mat-icon>
              <span>¡Grupo creado exitosamente!</span>
            </div>
            <p class="modal-subtitle">Comparte este link para invitar a otros miembros:</p>
            <div class="invite-link-box">
              <span class="invite-link-text" id="invite-link-text">{{ inviteLink() }}</span>
              <button class="copy-btn" id="copy-invite-link-btn" (click)="copyLink()" [class.copied]="copied()">
                <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                {{ copied() ? 'Copiado' : 'Copiar' }}
              </button>
            </div>
            <p class="hint">
              <mat-icon>info</mat-icon>
              Quien abra este link podrá unirse al grupo. Puedes regenerar o revocar el link cuando quieras.
            </p>

            @if (loadingInvite()) {
              <div class="loading-row"><span class="spinner"></span> Generando link...</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="view-members-btn" (click)="loadMembers()">
              <mat-icon>people</mat-icon> Ver miembros
            </button>
            <button class="btn-primary" (click)="close.emit()">
              <mat-icon>check</mat-icon> Listo
            </button>
          </div>
        }

        <!-- STEP: MEMBERS -->
        @if (step() === 'members') {
          <div class="modal-body">
            @if (loadingMembers()) {
              <div class="loading-row"><span class="spinner"></span> Cargando...</div>
            } @else {
              <ul class="members-list">
                @for (m of members(); track m.id) {
                  <li class="member-item">
                    <div class="member-avatar">{{ m.name.charAt(0).toUpperCase() }}</div>
                    <div class="member-info">
                      <span class="member-name">{{ m.name }}</span>
                      <span class="member-email">{{ m.email }}</span>
                    </div>
                    <span class="member-role" [class.admin]="m.role === 'admin'">{{ m.role }}</span>
                  </li>
                }
              </ul>
            }

            <div class="divider"></div>
            <p class="modal-subtitle">Link de invitación:</p>
            @if (inviteLink()) {
              <div class="invite-link-box">
                <span class="invite-link-text">{{ inviteLink() }}</span>
                <button class="copy-btn" (click)="copyLink()" [class.copied]="copied()">
                  <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                </button>
              </div>
              <button class="btn-danger-sm" id="revoke-invite-btn" (click)="revokeInvite()">
                <mat-icon>link_off</mat-icon> Revocar link
              </button>
            } @else {
              <button class="btn-secondary" id="generate-invite-btn" (click)="generateInvite()">
                <mat-icon>add_link</mat-icon> Generar nuevo link
              </button>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="close.emit()">Cerrar</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

    .modal-card {
      background: #1e1e2e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      margin: 1rem;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem 0;
    }
    .modal-title-row { display: flex; align-items: center; gap: 0.75rem; }
    .modal-title-row h2 { margin: 0; font-size: 1.1rem; color: #e2e8f0; font-weight: 600; }
    .modal-icon { color: #8b5cf6; }
    .modal-icon.success { color: #10b981; }

    .close-btn {
      background: none; border: none; cursor: pointer;
      color: #94a3b8; padding: 0.25rem; border-radius: 6px;
      display: flex; align-items: center;
      transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }

    .modal-body { padding: 1.25rem 1.5rem; }
    .modal-subtitle {
      color: #94a3b8; font-size: 0.875rem; margin: 0 0 1rem;
      display: flex; align-items: center; gap: 0.35rem;
    }
    .modal-subtitle mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }

    .field-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .field-group label { font-size: 0.8rem; color: #cbd5e1; font-weight: 500; }
    .text-input {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #e2e8f0;
      padding: 0.65rem 0.875rem;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
      width: 100%;
      box-sizing: border-box;
    }
    .text-input:focus { border-color: #8b5cf6; }
    .text-input::placeholder { color: #475569; }

    .error-msg { color: #f87171; font-size: 0.8rem; margin: 0.5rem 0 0; }

    .success-banner {
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex; align-items: center; gap: 0.5rem;
      color: #10b981; font-weight: 500; font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .invite-link-box {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 0.65rem 0.875rem;
      display: flex; align-items: center; gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .invite-link-text {
      flex: 1; color: #a5b4fc; font-size: 0.78rem;
      word-break: break-all; font-family: monospace;
    }
    .copy-btn {
      background: rgba(139,92,246,0.15);
      border: 1px solid rgba(139,92,246,0.3);
      border-radius: 6px; cursor: pointer;
      color: #a5b4fc; padding: 0.35rem 0.65rem;
      display: flex; align-items: center; gap: 0.3rem;
      font-size: 0.78rem; font-weight: 500;
      transition: all 0.15s; white-space: nowrap;
    }
    .copy-btn:hover { background: rgba(139,92,246,0.3); }
    .copy-btn.copied { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #10b981; }
    .copy-btn mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }

    .hint {
      color: #64748b; font-size: 0.78rem;
      display: flex; align-items: flex-start; gap: 0.35rem; margin: 0;
    }
    .hint mat-icon { font-size: 0.9rem; width: 0.9rem; height: 0.9rem; margin-top: 1px; }

    .loading-row {
      display: flex; align-items: center; gap: 0.5rem;
      color: #94a3b8; font-size: 0.875rem; padding: 0.5rem 0;
    }

    /* Members list */
    .members-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .member-item {
      display: flex; align-items: center; gap: 0.75rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px; padding: 0.6rem 0.75rem;
    }
    .member-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem; color: white; flex-shrink: 0;
    }
    .member-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .member-name { font-size: 0.875rem; color: #e2e8f0; font-weight: 500; }
    .member-email { font-size: 0.75rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-role {
      font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 20px;
      background: rgba(100,116,139,0.2); color: #94a3b8; text-transform: capitalize;
    }
    .member-role.admin { background: rgba(139,92,246,0.2); color: #a5b4fc; }

    .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 1rem 0; }

    .btn-danger-sm {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      color: #f87171; border-radius: 6px; cursor: pointer;
      padding: 0.35rem 0.75rem; font-size: 0.78rem;
      display: flex; align-items: center; gap: 0.3rem;
      transition: all 0.15s; margin-top: 0.5rem;
    }
    .btn-danger-sm:hover { background: rgba(239,68,68,0.2); }
    .btn-danger-sm mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }

    .modal-footer {
      padding: 1rem 1.5rem 1.25rem;
      border-top: 1px solid rgba(255,255,255,0.07);
      display: flex; justify-content: flex-end; gap: 0.75rem;
    }
    .btn-primary, .btn-secondary {
      border: none; cursor: pointer; border-radius: 8px;
      padding: 0.6rem 1.1rem; font-size: 0.875rem; font-weight: 500;
      display: flex; align-items: center; gap: 0.4rem; transition: all 0.15s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: white;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      background: rgba(255,255,255,0.07); color: #94a3b8;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.12); color: #e2e8f0; }
    .btn-primary mat-icon, .btn-secondary mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }

    .spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg) } }
  `]
})
export class WorkspaceModalComponent {
  @Input() mode: 'create' | 'manage' = 'create'; // 'manage' = se abre con step='members'
  @Input() workspaceId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() workspaceCreated = new EventEmitter<void>();

  step = signal<ModalStep>('create');
  workspaceName = '';
  createdWorkspaceName = '';
  createdWorkspaceId = '';

  loading = signal(false);
  loadingInvite = signal(false);
  loadingMembers = signal(false);
  errorMsg = signal('');
  inviteLink = signal('');
  copied = signal(false);
  members = signal<WorkspaceMember[]>([]);

  constructor(private workspacesService: WorkspacesService) {}

  ngOnInit() {
    if (this.mode === 'manage' && this.workspaceId) {
      this.step.set('members');
      this.createdWorkspaceId = this.workspaceId;
      this.loadMembers();
    }
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  createGroup() {
    const name = this.workspaceName.trim();
    if (!name) {
      this.errorMsg.set('El nombre no puede estar vacío');
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    this.workspacesService.createWorkspace(name).subscribe({
      next: (ws) => {
        this.createdWorkspaceName = ws.name;
        this.createdWorkspaceId = ws.id;
        this.loading.set(false);
        this.workspaceCreated.emit();
        this.step.set('invite');
        this.generateInvite();
      },
      error: () => {
        this.errorMsg.set('Error al crear el grupo, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  generateInvite() {
    if (!this.createdWorkspaceId) return;
    this.loadingInvite.set(true);

    this.workspacesService.generateInvite(this.createdWorkspaceId).subscribe({
      next: (res) => {
        const base = window.location.origin;
        this.inviteLink.set(`${base}/join?token=${res.token}`);
        this.loadingInvite.set(false);
      },
      error: () => { this.loadingInvite.set(false); }
    });
  }

  revokeInvite() {
    if (!this.createdWorkspaceId) return;
    this.workspacesService.revokeInvite(this.createdWorkspaceId).subscribe(() => {
      this.inviteLink.set('');
    });
  }

  copyLink() {
    navigator.clipboard.writeText(this.inviteLink()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  loadMembers() {
    const id = this.createdWorkspaceId || this.workspaceId;
    if (!id) return;
    this.step.set('members');
    this.loadingMembers.set(true);

    this.workspacesService.getMembers(id).subscribe({
      next: (data) => {
        this.members.set(data);
        this.loadingMembers.set(false);
        // También intentar traer el link activo si existe
        this.workspacesService.generateInvite(id).subscribe({
          next: (r) => this.inviteLink.set(`${window.location.origin}/join?token=${r.token}`),
          error: () => {}
        });
      },
      error: () => { this.loadingMembers.set(false); }
    });
  }
}
