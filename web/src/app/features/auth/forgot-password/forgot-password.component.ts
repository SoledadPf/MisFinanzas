import { Component, signal, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header" [class.step-token]="step() === 'token'">
          @if (step() === 'email') {
            <div class="logo-wrapper">
              <mat-icon>lock_reset</mat-icon>
            </div>
            <h1>Recuperar Contraseña</h1>
            <p>Ingresa tu correo para recibir un código de recuperación.</p>
          } @else if (step() === 'token') {
            <h1>Código de Verificación</h1>
            <p>Enviamos un código de 6 dígitos a tu correo.</p>
          } @else {
            <div class="logo-wrapper">
              <mat-icon>lock</mat-icon>
            </div>
            <h1>Nueva Contraseña</h1>
            <p>Ingresa y confirma tu nueva contraseña segura.</p>
          }
        </div>

        @if (step() === 'email') {
          <form class="auth-form" (ngSubmit)="sendCode()">
            <!-- FORM EMAIL -->
            <div class="field-group">
              <label class="field-label" for="email">Correo electrónico</label>
              <div class="input-wrapper">
                <mat-icon class="field-icon">mail</mat-icon>
                <input id="email" type="email" [(ngModel)]="email" name="email" required
                       placeholder="tu@correo.com">
              </div>
            </div>

            @if (errorMsg()) {
              <div class="error-msg">
                <mat-icon>error_outline</mat-icon>
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" class="submit-btn" [disabled]="loading() || !email">
              @if (loading()) {
                <div class="spinner-container">
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Enviando...</span>
                </div>
              } @else {
                Enviar código
              }
            </button>
          </form>
        } @else if (step() === 'token') {
          <!-- VERIFICACION 6 CAJAS -->
          <form class="auth-form" (ngSubmit)="verifyCode()">
            <div class="field-group token-group">
              <div class="token-inputs">
                @for (digit of tokenArray; track $index) {
                  <input type="text"
                         #tokenInput
                         pattern="[0-9]*"
                         inputmode="numeric"
                         maxlength="1"
                         [(ngModel)]="tokenArray[$index]"
                         name="t{{$index}}"
                         (input)="onTokenInput($event, $index)"
                         (keydown)="onTokenKeydown($event, $index)"
                         (paste)="onTokenPaste($event)">
                }
              </div>
            </div>

            @if (errorMsg()) {
              <div class="error-msg token-error">
                <mat-icon>error_outline</mat-icon>
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" class="submit-btn token-btn" [disabled]="loading() || isTokenIncomplete()">
              @if (loading()) {
                <div class="spinner-container">
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Verificando...</span>
                </div>
              } @else {
                Verificar Cuenta
              }
            </button>
            <div class="resend-text" (click)="!loading() && sendCode()">
              <span>¿No recibiste el código?</span> <a>Reenviar</a>
            </div>
          </form>
        } @else {
          <!-- NUEVA PASS -->
          <form class="auth-form" (ngSubmit)="resetPassword()">
            <div class="field-group">
              <label class="field-label" for="newPassword">Contraseña segura</label>
              <div class="input-wrapper">
                <mat-icon class="field-icon">lock</mat-icon>
                <input id="newPassword" [type]="hidePassword() ? 'password' : 'text'"
                       [(ngModel)]="newPassword" name="newPassword" required
                       placeholder="Mínimo 6 caracteres" minlength="6">
                <button type="button" class="toggle-password" (click)="togglePassword()">
                  <mat-icon>{{ hidePassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
                </button>
              </div>
            </div>

            @if (errorMsg()) {
              <div class="error-msg">
                <mat-icon>error_outline</mat-icon>
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" class="submit-btn" [disabled]="loading() || newPassword.length < 6">
              @if (loading()) {
                <div class="spinner-container">
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Actualizando...</span>
                </div>
              } @else {
                Cambiar Contraseña
              }
            </button>
          </form>
        }

        <div class="auth-link">
          <a routerLink="/auth/login">Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss', './forgot-password.component.scss']
})
export class ForgotPasswordComponent implements AfterViewInit {
  step = signal<'email' | 'token' | 'password'>('email');
  loading = signal(false);
  errorMsg = signal('');
  hidePassword = signal(true);

  email = '';
  tokenArray = ['', '', '', '', '', ''];
  newPassword = '';

  @ViewChildren('tokenInput') tokenInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit() {
    // Si estuviéramos en step token desde el inicio podríamos hacer focus
  }

  // --- Helpers UI Token ---
  isTokenIncomplete(): boolean {
    return this.tokenArray.some(val => !val);
  }

  get token(): string {
    return this.tokenArray.join('');
  }

  onTokenInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, ''); // solo números
    this.tokenArray[index] = input.value;

    if (input.value && index < 5) {
      this.tokenInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onTokenKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.tokenArray[index] && index > 0) {
      this.tokenInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onTokenPaste(event: ClipboardEvent) {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const cleanPaste = paste.replace(/[^0-9]/g, '').slice(0, 6);
    
    for (let i = 0; i < cleanPaste.length; i++) {
      this.tokenArray[i] = cleanPaste[i];
    }
    
    // Focus el ultimo
    const focusIndex = Math.min(cleanPaste.length, 5);
    setTimeout(() => {
      this.tokenInputs.toArray()[focusIndex].nativeElement.focus();
    });
  }


  // --- Flujo Servidor ---
  togglePassword() {
    this.hidePassword.update(v => !v);
  }

  sendCode() {
    if (!this.email) return;

    this.loading.set(true);
    this.errorMsg.set('');
    
    // Resetear token si está reenviando
    this.tokenArray = ['', '', '', '', '', ''];

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.step.set('token');
        this.snackBar.open(res.message || 'Código enviado', 'OK', { duration: 3000 });
        setTimeout(() => this.tokenInputs.first?.nativeElement.focus(), 100);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Hubo un error al enviar el código. Revisa tu email.');
      }
    });
  }

  verifyCode() {
    if (this.isTokenIncomplete()) return;

    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.verifyResetToken({
      email: this.email,
      token: this.token
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('password');
        this.errorMsg.set('');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Código inválido o expirado.');
      }
    });
  }

  resetPassword() {
    if (this.newPassword.length < 6) return;

    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.snackBar.open('Contraseña actualizada exitosamente', 'OK', { duration: 3000 });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Error al restablecer contraseña. El código pudo haber expirado.');
      }
    });
  }
}
