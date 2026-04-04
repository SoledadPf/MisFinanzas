import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-wrapper">💰</div>
          <h1>Crear Cuenta</h1>
          <p>Empieza a controlar tus finanzas</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field-group">
            <label class="field-label" for="name">Nombre completo</label>
            <div class="input-wrapper">
              <mat-icon class="field-icon">person</mat-icon>
              <input
                id="name"
                type="text"
                [(ngModel)]="name"
                name="name"
                placeholder="Tu nombre"
                required
                autocomplete="name"
              >
            </div>
          </div>

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
                placeholder="Mínimo 6 caracteres"
                required
                minlength="6"
                autocomplete="new-password"
              >
              <button class="toggle-password" type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (password.length > 0) {
              <div class="strength-bar">
                <div class="strength-fill" [class]="strengthClass"></div>
              </div>
              <span class="strength-label" [class]="strengthClass">{{ strengthLabel }}</span>
            }
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
                Creando cuenta...
              </span>
            } @else {
              Crear Cuenta
            }
          </button>
        </form>

        <p class="auth-link">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  hidePassword = true;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  get passwordStrength(): number {
    const p = this.password;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }

  get strengthClass(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'weak';
    if (s <= 3) return 'medium';
    return 'strong';
  }

  get strengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'Débil';
    if (s <= 3) return 'Regular';
    return 'Fuerte';
  }

  onSubmit() {
    if (!this.name || !this.email || !this.password) return;
    this.loading = true;
    this.error = '';

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al registrarse';
      },
    });
  }
}
