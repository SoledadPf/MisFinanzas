import { Component, OnInit, ChangeDetectorRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary, CategoryBreakdown, MonthlyTrend, UpcomingPayment } from '../../core/models/interfaces';
import { PaymentsService } from '../../core/services/payments.service';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

const MONTHS_FULL = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="dashboard">
      <!-- Month selector -->
      <div class="month-selector">
        <button class="nav-arrow" (click)="changeMonth(-1)">&#8249;</button>
        <div class="month-label">
          <h2>{{ monthName }}</h2>
          <span>{{ year }}</span>
        </div>
        <button class="nav-arrow" (click)="changeMonth(1)">&#8250;</button>
      </div>

      <!-- Stat cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Mes</span>
            <span class="stat-value green">S/ {{ (summary?.totalMonth ?? 0) | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Pagado</span>
            <span class="stat-value blue">S/ {{ (summary?.totalPaid ?? 0) | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" [class.red]="(summary?.totalPending ?? 0) > 0" [class.green]="(summary?.totalPending ?? 0) <= 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Pendiente</span>
            <span class="stat-value" [class.red]="(summary?.totalPending ?? 0) > 0" [class.green]="(summary?.totalPending ?? 0) <= 0">
              S/ {{ (summary?.totalPending ?? 0) | number:'1.2-2' }}
            </span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Gastos Variables</span>
            <span class="stat-value orange">S/ {{ (summary?.totalVariable ?? 0) | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="charts-row">
        <div class="chart-card">
          <h3>Gastos por Categoría</h3>
          @if (categoryData.length > 0) {
            <div class="chart-wrap donut-wrap">
              <canvas baseChart
                [data]="pieChartData"
                [options]="pieChartOptions"
                type="doughnut">
              </canvas>
            </div>
          } @else {
            <div class="empty-chart">Sin datos este mes</div>
          }
        </div>

        <div class="chart-card">
          <h3>Tendencia Mensual <span class="muted">{{ year }}</span></h3>
          <div class="chart-wrap">
            <canvas baseChart
              [data]="lineChartData"
              [options]="lineChartOptions"
              type="line">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Upcoming payments -->
      <div class="upcoming-card">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          Próximos Pagos — {{ monthName }}
        </h3>
        @if (upcoming.length === 0) {
          <div class="all-paid">
            <span class="sparkle">✨</span>
            <span>¡Todo pagado este mes!</span>
          </div>
        } @else {
          @for (item of upcoming; track item.id) {
            <div class="upcoming-item">
              <div class="upcoming-left">
                <span class="upcoming-icon">{{ item.category?.icon }}</span>
                <div>
                  <span class="upcoming-name">{{ item.name }}</span>
                  <span class="upcoming-due">Vence día {{ item.dueDay }}</span>
                </div>
              </div>
              <div class="upcoming-right">
                @if (item.remaining < item.amount) {
                   <div style="text-align: right; margin-right: 10px;">
                     <span class="upcoming-amount">Falta S/ {{ item.remaining | number:'1.2-2' }}</span><br/>
                     <span style="font-size: 0.75rem; color: #a0aec0;">De S/ {{ item.amount | number:'1.2-2' }}</span>
                   </div>
                } @else {
                   <span class="upcoming-amount" style="margin-right: 15px;">S/ {{ item.amount | number:'1.2-2' }}</span>
                }
                <button class="pay-btn" (click)="markPaid(item)">Pagar</button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  monthName = '';

  summary: DashboardSummary | null = null;
  categoryData: CategoryBreakdown[] = [];
  trendData: MonthlyTrend[] = [];
  upcoming: UpcomingPayment[] = [];

  // Doughnut chart
  pieChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, usePointStyle: true, color: '#8892a8', font: { size: 12 } }
      }
    },
    cutout: '65%',
  };

  // Line chart
  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, color: '#8892a8', font: { size: 12 } } }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8892a8' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8892a8', callback: (v) => 'S/ ' + v }
      }
    },
    elements: { line: { tension: 0.4 } }
  };

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private dashboardService: DashboardService,
    private paymentsService: PaymentsService,
    public workspacesService: WorkspacesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    effect(() => {
      // Registrar dependencia del active workspace
      const ws = this.workspacesService.activeWorkspace();
      this.loadData();
    });
  }

  ngOnInit() { 
    // loadData ya es llamado por el effect() inicial.
  }

  changeMonth(delta: number) {
    this.month += delta;
    if (this.month > 12) { this.month = 1; this.year++; }
    if (this.month < 1) { this.month = 12; this.year--; }
    this.loadData();
  }

  loadData() {
    this.monthName = MONTHS_FULL[this.month - 1];
    
    const ws = this.workspacesService.activeWorkspace();
    const workspaceId = ws ? ws.id : undefined;

    this.dashboardService.getSummary(this.year, this.month, workspaceId).subscribe(data => {
      this.summary = data;
      this.cdr.markForCheck();
    });

    this.dashboardService.getByCategory(this.year, this.month, workspaceId).subscribe(data => {
      this.categoryData = data;
      this.pieChartData = {
        labels: data.map(d => d.categoryName),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: data.map(d => d.color),
          borderWidth: 0,
        }],
      };
      this.cdr.markForCheck();
    });

    this.dashboardService.getTrend(this.year, workspaceId).subscribe(data => {
      this.trendData = data;
      this.lineChartData = {
        labels: data.map(d => d.name),
        datasets: [
          {
            label: 'Fijo',
            data: data.map(d => d.fixed),
            borderColor: '#27AE60',
            backgroundColor: 'rgba(39,174,96,0.15)',
            fill: true,
            pointBackgroundColor: '#27AE60',
            pointRadius: 3,
          },
          {
            label: 'Variable',
            data: data.map(d => d.variable),
            borderColor: '#e67e22',
            backgroundColor: 'rgba(230,126,34,0.1)',
            fill: true,
            pointBackgroundColor: '#e67e22',
            pointRadius: 3,
          },
        ],
      };
      this.cdr.markForCheck();
    });

    this.dashboardService.getUpcoming(this.year, this.month, workspaceId).subscribe(data => {
      this.upcoming = data;
      this.cdr.markForCheck();
    });
  }

  markPaid(item: UpcomingPayment) {
    this.paymentsService.create({
      expenseId: item.id,
      year: this.year,
      month: this.month,
      amountPaid: item.amount,
    }).subscribe(() => this.loadData());
  }
}
