import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth (sin navbar)
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },

  // Páginas protegidas con navbar (layout wrapper)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expense-list/expense-list.component').then((m) => m.ExpenseListComponent),
      },
      {
        path: 'expenses/new',
        loadComponent: () =>
          import('./features/expenses/expense-form/expense-form.component').then((m) => m.ExpenseFormComponent),
      },
      {
        path: 'expenses/edit/:id',
        loadComponent: () =>
          import('./features/expenses/expense-form/expense-form.component').then((m) => m.ExpenseFormComponent),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then((m) => m.CalendarComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
