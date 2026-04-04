import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-wrapper">💰</div>
          <h1>MisFinanzas</h1>
          <p>Inicia sesión para gestionar tus finanzas</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field-group">
            <label class="field-label" for="email">Correo electrónico</label>
            <div class="input-wrapper">
              <mat-icon class="field-icon">email</mat-icon>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="tu@correo.com"
                required
                autocomplete="email"
              >
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="password">Contraseña</label>
            <div class="input-wrapper">
              <mat-icon class="field-icon">lock</mat-icon>
              <input
                id="password"
                [type]="hidePassword ? 'password' : 'text'"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              >
              <button class="toggle-password" type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
          </div>

          @if (error) {
            <div class="error-msg">
              <mat-icon>error_outline</mat-icon>
              {{ error }}
            </div>
          }

          <button class="submit-btn" type="submit" [disabled]="loading">
            @if (loading) {
              <span class="spinner-container">
                <mat-spinner diameter="20"></mat-spinner>
                Iniciando sesión...
              </span>
            } @else {
              Iniciar Sesión
            }
          </button>
        </form>

        <div class="auth-link" style="margin-top: 12px; margin-bottom: 24px;">
          <a routerLink="/auth/forgot-password">¿Olvidaste tu contraseña?</a>
        </div>

        <div class="auth-divider">
          <span></span><p>o</p><span></span>
        </div>

        <p class="auth-link">
          ¿No tienes cuenta?
          <a routerLink="/auth/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  hidePassword = true;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al iniciar sesión';
      },
    });
  }
}
