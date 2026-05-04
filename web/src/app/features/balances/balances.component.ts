import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WorkspacesService } from '../../core/services/workspaces.service';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="balances-page">
      <div class="header-section">
        <div class="title-wrap">
          <mat-icon class="page-icon">balance</mat-icon>
          <h1>Cuentas Claras</h1>
        </div>
        <p class="subtitle">Calcula quién le debe a quién en tu grupo seleccionado.</p>
      </div>

      <div class="controls-card">
        <div class="control-group">
          <label>Mes a Liquidar</label>
          <select [(ngModel)]="selectedMonth" (ngModelChange)="loadBalances()">
            @for (m of months; track $index) {
              <option [value]="$index + 1">{{ m }}</option>
            }
          </select>
        </div>
        <div class="control-group">
          <label>Año</label>
          <input type="number" [(ngModel)]="selectedYear" (change)="loadBalances()" min="2020" max="2100">
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Calculando saldos...</p>
        </div>
      } @else if (!workspacesService.activeWorkspace()) {
        <div class="empty-state">
          <mat-icon>error_outline</mat-icon>
          <h2>No hay grupo seleccionado</h2>
          <p>Selecciona o crea un grupo en la barra superior para ver las cuentas.</p>
        </div>
      } @else if (balances().length === 0) {
        <div class="empty-state">
          <mat-icon>celebration</mat-icon>
          <h2>¡Todo al día!</h2>
          <p>Nadie debe nada en este grupo o no hay gastos registrados este mes.</p>
        </div>
      } @else {
        <div class="balances-grid">
          @for (balance of balances(); track balance.userId) {
            <div class="balance-card" [ngClass]="getCardClass(balance.balance)">
              <div class="user-row">
                <div class="avatar">{{ getUserName(balance.userId).charAt(0).toUpperCase() }}</div>
                <h3>{{ getUserName(balance.userId) }}</h3>
              </div>
              
              <div class="stats-row">
                <div class="stat">
                  <span class="label">Debía Pagar</span>
                  <span class="val">S/ {{ balance.oughtToPay | number:'1.2-2' }}</span>
                </div>
                <div class="stat">
                  <span class="label">Pagó Realmente</span>
                  <span class="val">S/ {{ balance.actuallyPaid | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="result-row">
                <span>Saldo final:</span>
                <span class="result-amount" [ngClass]="getCardClass(balance.balance)">
                  {{ formatBalance(balance.balance) }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './balances.component.scss'
})
export class BalancesComponent implements OnInit {
  loading = signal(false);
  balances = signal<any[]>([]);
  members = signal<any[]>([]);

  months = MONTHS_SHORT;
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  private cdr = inject(ChangeDetectorRef);

  constructor(
    public workspacesService: WorkspacesService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadBalances();
  }

  loadBalances() {
    const ws = this.workspacesService.activeWorkspace();
    if (!ws) return;

    this.loading.set(true);
    
    // Primero traer a todos los miembros para mapear UserID con Nombres
    this.http.get<any[]>(`${environment.apiUrl}/workspaces/${ws.id}/members`).subscribe(users => {
      this.members.set(users);

      this.http.get<any[]>(`${environment.apiUrl}/workspaces/${ws.id}/balances?month=${this.selectedMonth}&year=${this.selectedYear}`)
        .subscribe(data => {
          this.balances.set(data);
          this.loading.set(false);
          this.cdr.markForCheck();
        });
    });
  }

  getUserName(userId: string): string {
    const member = this.members().find(m => m.id === userId);
    return member ? member.name : 'Usuario Desconocido';
  }

  getCardClass(balance: number): string {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  }

  formatBalance(balance: number): string {
    if (balance > 0) return `+ S/ ${balance.toFixed(2)} (Le deben)`;
    if (balance < 0) return `- S/ ${Math.abs(balance).toFixed(2)} (Debe al grupo)`;
    return 'S/ 0.00 (Empate)';
  }
}
