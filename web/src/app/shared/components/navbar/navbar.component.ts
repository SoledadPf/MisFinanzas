import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
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
      </nav>

      <!-- User + logout -->
      <div class="top-actions">
        <div class="user-avatar">{{ auth.user()?.name?.charAt(0)?.toUpperCase() }}</div>
        <button class="logout-btn" (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </header>
  `,
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
