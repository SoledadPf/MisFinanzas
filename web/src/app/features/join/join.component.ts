import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { AuthService } from '../../core/services/auth.service';

type JoinState = 'loading' | 'preview' | 'joining' | 'success' | 'error' | 'already-member';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="join-page">
      <div class="join-card" id="join-card">

        <!-- LOADING -->
        @if (state() === 'loading') {
          <div class="state-block">
            <div class="pulse-icon">🔗</div>
            <p class="hint-text">Verificando invitación...</p>
          </div>
        }

        <!-- PREVIEW — mostrar nombre del grupo y botón unirse -->
        @if (state() === 'preview') {
          <div class="state-block">
            <div class="group-emoji">👥</div>
            <h1 class="group-name">{{ workspaceName() }}</h1>
            <p class="invite-text">Fuiste invitado a unirte a este grupo en <strong>MisFinanzas</strong></p>
            <button class="btn-join" id="join-group-btn" (click)="joinGroup()">
              <mat-icon>group_add</mat-icon>
              Unirme al grupo
            </button>
            <button class="btn-back" (click)="goHome()">Cancelar</button>
          </div>
        }

        <!-- JOINING -->
        @if (state() === 'joining') {
          <div class="state-block">
            <div class="spinner-lg"></div>
            <p class="hint-text">Uniéndote al grupo...</p>
          </div>
        }

        <!-- SUCCESS -->
        @if (state() === 'success') {
          <div class="state-block">
            <div class="success-icon">✅</div>
            <h2 class="success-title">¡Te uniste!</h2>
            <p class="hint-text">Ahora eres miembro de <strong>{{ workspaceName() }}</strong></p>
            <button class="btn-join" id="go-to-dashboard-btn" (click)="goHome()">
              <mat-icon>dashboard</mat-icon>
              Ir al dashboard
            </button>
          </div>
        }

        <!-- ALREADY MEMBER -->
        @if (state() === 'already-member') {
          <div class="state-block">
            <div class="info-icon">ℹ️</div>
            <h2>Ya eres miembro</h2>
            <p class="hint-text">Ya perteneces a este grupo.</p>
            <button class="btn-join" (click)="goHome()">
              <mat-icon>home</mat-icon> Ir al inicio
            </button>
          </div>
        }

        <!-- ERROR -->
        @if (state() === 'error') {
          <div class="state-block">
            <div class="error-icon">❌</div>
            <h2>Link inválido</h2>
            <p class="hint-text">{{ errorMsg() }}</p>
            <button class="btn-back" (click)="goHome()">Volver al inicio</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .join-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at 50% 20%, rgba(139,92,246,0.15) 0%, transparent 60%),
                  #0d1117;
      padding: 1rem;
    }

    .join-card {
      background: rgba(30,30,46,0.95);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 3rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5);
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

    .state-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .group-emoji, .success-icon, .error-icon, .info-icon, .pulse-icon {
      font-size: 3.5rem;
      line-height: 1;
      margin-bottom: 0.5rem;
      animation: pop 0.4s ease;
    }
    @keyframes pop { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }

    .group-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #e2e8f0;
      margin: 0;
      background: linear-gradient(135deg, #a5b4fc, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .invite-text {
      color: #94a3b8;
      font-size: 0.9rem;
      margin: 0;
    }
    .invite-text strong { color: #c084fc; }

    .success-title { color: #10b981; font-size: 1.5rem; margin: 0; }

    .hint-text { color: #64748b; font-size: 0.875rem; margin: 0; }
    .hint-text strong { color: #a5b4fc; }

    .btn-join {
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 0.95rem;
      font-weight: 600;
      padding: 0.75rem 1.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 8px 24px rgba(99,102,241,0.3);
    }
    .btn-join:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.4); }

    .btn-back {
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.875rem;
      cursor: pointer;
      text-decoration: underline;
    }
    .btn-back:hover { color: #94a3b8; }

    .spinner-lg {
      width: 48px; height: 48px; border-radius: 50%;
      border: 4px solid rgba(139,92,246,0.2);
      border-top-color: #8b5cf6;
      animation: spin 0.8s linear infinite;
      margin: 1rem 0;
    }
    @keyframes spin { to { transform: rotate(360deg) } }
  `]
})
export class JoinComponent implements OnInit {
  state = signal<JoinState>('loading');
  workspaceName = signal('');
  errorMsg = signal('');
  token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workspacesService: WorkspacesService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.state.set('error');
      this.errorMsg.set('No se encontró token de invitación en el link.');
      return;
    }

    // Si no está logueado, guardar el token y redirigir al login
    if (!this.auth.user()) {
      sessionStorage.setItem('pendingInviteToken', this.token);
      this.router.navigate(['/auth/login'], { queryParams: { redirect: '/join', token: this.token } });
      return;
    }

    // Obtener info del workspace por token
    this.workspacesService.getWorkspaceInfoByToken(this.token).subscribe({
      next: (ws: { id: string; name: string }) => {
        this.workspaceName.set(ws.name);
        this.state.set('preview');
      },
      error: (err: { status: number; error?: { message?: string } }) => {
        this.state.set('error');
        this.errorMsg.set(err?.error?.message || 'El link de invitación no es válido o ya expiró.');
      }
    });
  }

  joinGroup() {
    this.state.set('joining');
    this.workspacesService.joinByToken(this.token).subscribe({
      next: (_res: { message: string }) => {
        this.workspacesService.loadWorkspaces().subscribe();
        this.state.set('success');
      },
      error: (err: { status: number; error?: { message?: string } }) => {
        if (err?.status === 409) {
          this.state.set('already-member');
        } else {
          this.state.set('error');
          this.errorMsg.set(err?.error?.message || 'Error al unirse al grupo.');
        }
      }
    });
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }
}
