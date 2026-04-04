import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="logo-pulse">
            <span class="logo-emoji">💰</span>
          </div>
          <div class="brand">MisFinanzas</div>
          <div class="dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #0d1117;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .logo-pulse {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, rgba(39,174,96,0.2), rgba(52,152,219,0.2));
      border: 1px solid rgba(39,174,96,0.3);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 1.6s ease-in-out infinite;
      box-shadow: 0 0 40px rgba(39,174,96,0.15);
    }

    .logo-emoji {
      font-size: 40px;
      animation: float 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1);     box-shadow: 0 0 30px rgba(39,174,96,0.15); }
      50%       { transform: scale(1.06); box-shadow: 0 0 50px rgba(39,174,96,0.30); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-4px); }
    }

    .brand {
      font-family: 'Inter', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #e8edf5;
      letter-spacing: -0.5px;
    }

    .dots {
      display: flex;
      gap: 8px;

      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #27AE60;
        animation: bounce 1.2s ease-in-out infinite;

        &:nth-child(2) { animation-delay: 0.2s; background: #3498db; }
        &:nth-child(3) { animation-delay: 0.4s; background: #e67e22; }
      }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40%            { transform: scale(1.1); opacity: 1;   }
    }
  `]
})
export class LoadingComponent implements OnInit, OnDestroy {
  isLoading = signal(false);
  private sub!: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Small delay so the loading feels intentional
        setTimeout(() => this.isLoading.set(false), 300);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
