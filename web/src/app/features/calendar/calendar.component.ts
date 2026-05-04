import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpensesService } from '../../core/services/expenses.service';
import { PaymentsService } from '../../core/services/payments.service';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { Expense, Payment } from '../../core/models/interfaces';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="calendar-page">
      <!-- Month selector -->
      <div class="month-selector">
        <button class="nav-arrow" (click)="changeMonth(-1)">&#8249;</button>
        <div class="month-label">
          <h2>{{ currentMonthName }}</h2>
          <span>{{ year }}</span>
        </div>
        <button class="nav-arrow" (click)="changeMonth(1)">&#8250;</button>
      </div>

      <!-- Title -->
      <div class="section-header">CALENDARIO DE PAGOS — {{ currentMonthName | uppercase }} {{ year }}</div>

      <!-- Calendar table -->
      <div class="calendar-card">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th class="col-name">Gasto</th>
                <th class="col-amount">Monto</th>
                <th class="col-day">Día</th>
                @for (m of months; track $index) {
                  <th class="col-month" [class.active-month]="$index === currentMonth">
                    {{ m }}
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (expense of fixedExpenses; track expense.id) {
                <tr>
                  <td class="col-name">
                    <div class="expense-cell">
                      <span class="expense-icon">{{ expense.category?.icon }}</span>
                      <span class="expense-name">{{ expense.name }}</span>
                    </div>
                  </td>
                  <td class="col-amount">S/ {{ expense.amount | number:'1.2-2' }}</td>
                  <td class="col-day">{{ expense.dueDay }}</td>
                  @for (m of months; track $index) {
                    <td class="col-month" [class.active-month]="$index === currentMonth">
                      <button class="pay-dot"
                              [class.paid]="isPaid(expense.id, $index + 1)"
                              [class.overdue]="isOverdue(expense, $index + 1)"
                              (click)="togglePay(expense, $index + 1)">
                        @if (isPaid(expense.id, $index + 1)) {
                          <span class="paid-initial">{{ getPaidByInitial(expense.id, $index + 1) || '✓' }}</span>
                        } @else if (isOverdue(expense, $index + 1)) {
                          <span class="dot red-dot"></span>
                        } @else {
                          <span class="dot"></span>
                        }
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (fixedExpenses.length === 0) {
        <div class="empty-state">
          <mat-icon>calendar_month</mat-icon>
          <p>No tienes gastos fijos registrados</p>
        </div>
      }

      <!-- Progress bar -->
      <div class="progress-card">
        <div class="progress-header">
          <span>Progreso de pago — {{ currentMonthName }}</span>
          <span class="pct">{{ progressPct | number:'1.0-0' }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="progressPct"></div>
          <span class="progress-label">{{ progressPct | number:'1.0-0' }}%</span>
        </div>
        <div class="progress-details">
          <span>Pagado: S/ {{ paidAmount | number:'1.2-2' }}</span>
          <span>Pendiente: S/ {{ pendingAmount | number:'1.2-2' }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  months = MONTHS_SHORT;
  year = new Date().getFullYear();
  currentMonth = new Date().getMonth(); // 0-indexed
  currentMonthName = MONTHS_FULL[new Date().getMonth()];

  fixedExpenses: Expense[] = [];
  paymentsMap = new Map<string, Set<number>>();
  paymentIdMap = new Map<string, string>();
  paymentPaidByMap = new Map<string, string>(); // 'expenseId-month' -> 'initial'

  progressPct = 0;
  paidAmount = 0;
  pendingAmount = 0;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private expensesService: ExpensesService,
    private paymentsService: PaymentsService,
    public workspacesService: WorkspacesService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() { 
    this.loadData();
    
    // Si cambia de workspace, recargar datos. Usamos effect() pero en zoneless el signal ya actualiza.
    // Un método simple es suscribirse a los cambios del signal manualmente o depender de ellos en un computed.
  }

  changeMonth(delta: number) {
    this.currentMonth += delta;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.year++;
      this.loadData();
    } else if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.year--;
      this.loadData();
    } else {
      this.currentMonthName = MONTHS_FULL[this.currentMonth];
      this.calculateProgress();
    }
  }

  loadData() {
    this.currentMonthName = MONTHS_FULL[this.currentMonth];
    const wsId = this.workspacesService.activeWorkspace()?.id;
    this.expensesService.getAll('fixed', wsId).subscribe(expenses => {
      this.fixedExpenses = expenses;
      this.loadAllPayments();
      this.cdr.markForCheck();
    });
  }

  loadAllPayments() {
    this.paymentsMap.clear();
    this.paymentIdMap.clear();
    this.paymentPaidByMap.clear();

    const wsId = this.workspacesService.activeWorkspace()?.id;
    let loaded = 0;
    for (let m = 1; m <= 12; m++) {
      this.paymentsService.getByMonth(this.year, m, wsId).subscribe(payments => {
        payments.forEach(p => {
          if (!this.paymentsMap.has(p.expenseId)) this.paymentsMap.set(p.expenseId, new Set());
          this.paymentsMap.get(p.expenseId)!.add(p.month);
          this.paymentIdMap.set(`${p.expenseId}-${p.month}`, p.id);
          if ((p as any).paidBy?.name) {
            this.paymentPaidByMap.set(`${p.expenseId}-${p.month}`, (p as any).paidBy.name.charAt(0).toUpperCase());
          }
        });
        loaded++;
        if (loaded === 12) {
          this.calculateProgress();
          this.cdr.markForCheck();
        }
      });
    }
  }

  isPaid(expenseId: string, month: number): boolean {
    return this.paymentsMap.get(expenseId)?.has(month) || false;
  }

  getPaidByInitial(expenseId: string, month: number): string {
    return this.paymentPaidByMap.get(`${expenseId}-${month}`) || '';
  }

  isOverdue(expense: Expense, month: number): boolean {
    // A month is overdue if it's past the current month in this year and unpaid
    if (this.year < new Date().getFullYear()) return false;
    if (this.year > new Date().getFullYear()) return false;
    const now = new Date();
    return month < now.getMonth() + 1 && !this.isPaid(expense.id, month);
  }

  togglePay(expense: Expense, month: number) {
    if (this.isPaid(expense.id, month)) {
      const paymentId = this.paymentIdMap.get(`${expense.id}-${month}`);
      if (paymentId) {
        this.paymentsService.delete(paymentId).subscribe(() => {
          this.paymentsMap.get(expense.id)?.delete(month);
          this.paymentIdMap.delete(`${expense.id}-${month}`);
          this.paymentPaidByMap.delete(`${expense.id}-${month}`);
          this.calculateProgress();
          this.cdr.markForCheck();
          this.snackBar.open('Pago desmarcado', 'OK', { duration: 1500 });
        });
      }
    } else {
      this.paymentsService.create({
        expenseId: expense.id,
        year: this.year,
        month,
        amountPaid: Number(expense.amount),
      }).subscribe(payment => {
        if (!this.paymentsMap.has(expense.id)) this.paymentsMap.set(expense.id, new Set());
        this.paymentsMap.get(expense.id)!.add(month);
        this.paymentIdMap.set(`${expense.id}-${month}`, payment.id);
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const initial = JSON.parse(userStr).name.charAt(0).toUpperCase();
          this.paymentPaidByMap.set(`${expense.id}-${month}`, initial);
        }

        this.calculateProgress();
        this.cdr.markForCheck();
        this.snackBar.open('Marcado como pagado', 'OK', { duration: 1500 });
      });
    }
  }

  calculateProgress() {
    const currentM = this.currentMonth + 1;
    const total = this.fixedExpenses.reduce((s, e) => s + Number(e.amount), 0);
    let paid = 0;
    this.fixedExpenses.forEach(e => {
      if (this.isPaid(e.id, currentM)) paid += Number(e.amount);
    });
    this.paidAmount = paid;
    this.pendingAmount = total - paid;
    this.progressPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  }
}
