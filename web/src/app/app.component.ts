import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    @if (auth.isAuthenticated()) {
      <app-navbar />
    }
    <main [class.with-nav]="auth.isAuthenticated()">
      <router-outlet />
    </main>
  `,
  styles: [`
    main.with-nav {
      margin-left: 240px;
      padding: 24px;
      min-height: 100vh;
      background: #f5f7fa;
    }

    @media (max-width: 768px) {
      main.with-nav {
        margin-left: 0;
        padding: 16px;
        padding-bottom: 80px;
      }
    }
  `],
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
