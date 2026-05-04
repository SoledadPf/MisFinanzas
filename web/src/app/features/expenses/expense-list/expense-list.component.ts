import { Component, OnInit, ChangeDetectorRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../core/services/expenses.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { Expense, Category, Payment } from '../../../core/models/interfaces';
import { WorkspacesService } from '../../../core/services/workspaces.service';
import { AuthService } from '../../../core/services/auth.service';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PaymentModalComponent } from '../../../shared/components/payment-modal/payment-modal.component';

const MONTHS_FULL = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, MatDialogModule],
  template: `
    <div class="expenses-page">
      <!-- Month selector -->
      <div class="month-selector">
        <button class="nav-arrow" (click)="changeMonth(-1)">&#8249;</button>
        <div class="month-label">
          <h2>{{ monthName }}</h2>
          <span>{{ currentYear }}</span>
        </div>
        <button class="nav-arrow" (click)="changeMonth(1)">&#8250;</button>
      </div>

      <!-- Filters + Add button -->
      <div class="toolbar">
        <div class="filters">
          <div class="select-wrap">
            <select [(ngModel)]="filterType" (change)="loadExpenses()">
              <option value="">Todos</option>
              <option value="fixed">Fijos</option>
              <option value="variable">Variables</option>
            </select>
          </div>
          <div class="select-wrap">
            <select [(ngModel)]="filterCategory" (change)="applyFilters()">
              <option value="">Todas las categorías</option>
              @for (cat of categories; track cat.id) {
                <option [value]="cat.id">{{ cat.icon }} {{ cat.name }}</option>
              }
            </select>
          </div>
        </div>
        <button class="add-btn" (click)="router.navigate(['/expenses/new'])">
          <mat-icon>add</mat-icon> Agregar
        </button>
      </div>

      <!-- Fixed expenses section -->
      @if (fixedExpenses.length > 0) {
        <div class="section-header">GASTOS FIJOS MENSUALES</div>
        @for (expense of fixedExpenses; track expense.id) {
          <div class="expense-item" [class.is-paid]="isPaidFull(expense)" [class.is-partial]="isPaidPartial(expense)">
            <div class="expense-left">
              <button class="check-box" [class.checked]="isPaidFull(expense)" [class.partial]="isPaidPartial(expense)"
                      (click)="togglePayment(expense)">
                @if (isPaidFull(expense)) {
                  <mat-icon>check</mat-icon>
                }
                @if (isPaidPartial(expense) && !isPaidFull(expense)) {
                  <mat-icon>horizontal_rule</mat-icon>
                }
              </button>
              <div class="expense-icon-wrap" [class.partial-bg]="isPaidPartial(expense)">
                {{ expense.category?.icon }}
              </div>
              <div class="expense-info">
                <span class="expense-name" [class.paid-text]="isPaidFull(expense)">
                  {{ expense.name }}
                  @if (getSplitBadge(expense); as badge) {
                    <span class="split-badge" [ngClass]="badge.class">{{ badge.text }}</span>
                  }
                </span>
                <span class="expense-meta">
                  {{ expense.category?.name }} · Día {{ expense.dueDay }}
                </span>
              </div>
            </div>
            <div class="expense-right">
              <span class="expense-amount" [class.paid-amount]="isPaidFull(expense)">
                 @if (isPaidPartial(expense) && !isPaidFull(expense)) {
                    <span class="partial-text" style="font-size: 0.8rem; color: #e67e22; margin-right: 5px;">(Pagado S/ {{ getPaidAmount(expense) | number:'1.2-2' }})</span>
                 }
                S/ {{ expense.amount | number:'1.2-2' }}
              </span>
              <div class="action-btns">
                <button class="icon-btn edit-btn" title="Editar" (click)="router.navigate(['/expenses/edit', expense.id])">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="icon-btn" title="Eliminar" (click)="deleteExpense(expense)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- Variable expenses section -->
      <div class="section-header">GASTOS VARIABLES — {{ monthName | uppercase }}</div>
      @if (variableExpenses.length > 0) {
        @for (expense of variableExpenses; track expense.id) {
          <div class="expense-item variable">
            <div class="expense-left">
              <div class="expense-icon-wrap">{{ expense.category?.icon }}</div>
              <div class="expense-info">
                <span class="expense-name">
                  {{ expense.name }}
                  @if (getSplitBadge(expense); as badge) {
                    <span class="split-badge" [ngClass]="badge.class">{{ badge.text }}</span>
                  }
                </span>
                <span class="expense-meta">
                  {{ expense.category?.name }} · {{ expense.date | date:'yyyy-MM-dd' }}
                </span>
              </div>
            </div>
            <div class="expense-right">
              <span class="expense-amount variable-amount">
                S/ {{ expense.amount | number:'1.2-2' }}
              </span>
              <div class="action-btns">
                <button class="icon-btn edit-btn" title="Editar" (click)="router.navigate(['/expenses/edit', expense.id])">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="icon-btn" title="Eliminar" (click)="deleteExpense(expense)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="empty-section">Sin gastos variables este mes</div>
      }

      @if (filteredExpenses.length === 0 && fixedExpenses.length === 0) {
        <div class="empty-state">
          <mat-icon>receipt_long</mat-icon>
          <p>No tienes gastos registrados</p>
          <button class="add-btn" (click)="router.navigate(['/expenses/new'])">
            Agregar mi primer gasto
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './expense-list.component.scss',
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  categories: Category[] = [];
  currentMonthPayments: Payment[] = [];

  filterType = '';
  filterCategory = '';

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  monthName = '';

  get fixedExpenses() { return this.filteredExpenses.filter(e => e.type === 'fixed'); }
  get variableExpenses() { return this.filteredExpenses.filter(e => e.type === 'variable'); }

  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);
  meId = this.authService.user()?.id;

  constructor(
    private expensesService: ExpensesService,
    private categoriesService: CategoriesService,
    private paymentsService: PaymentsService,
    private snackBar: MatSnackBar,
    public router: Router,
    public workspacesService: WorkspacesService
  ) {
    // Al cambiar la workspace (o si es null = personal), recargamos
    effect(() => {
      const activeWs = this.workspacesService.activeWorkspace();
      this.loadExpenses();
      this.loadPayments();
    });
  }

  ngOnInit() {
    this.monthName = MONTHS_FULL[this.currentMonth - 1];
    this.categoriesService.getAll().subscribe(cats => {
      this.categories = cats;
      this.cdr.markForCheck();
    });
    this.loadExpenses();
    this.loadPayments();
  }

  changeMonth(delta: number) {
    this.currentMonth += delta;
    if (this.currentMonth > 12) { this.currentMonth = 1; this.currentYear++; }
    if (this.currentMonth < 1)  { this.currentMonth = 12; this.currentYear--; }
    this.monthName = MONTHS_FULL[this.currentMonth - 1];
    this.loadExpenses();
    this.loadPayments();
  }

  loadExpenses() {
    const type = this.filterType || undefined;
    const ws = this.workspacesService.activeWorkspace();
    const workspaceId = ws ? ws.id : undefined;

    this.expensesService.getAll(type, workspaceId).subscribe(data => {
      this.expenses = data;
      this.applyFilters();
    });
  }

  loadPayments() {
    const ws = this.workspacesService.activeWorkspace();
    const workspaceId = ws ? ws.id : undefined;

    this.paymentsService.getByMonth(this.currentYear, this.currentMonth, workspaceId).subscribe(data => {
      this.currentMonthPayments = data;
      this.cdr.markForCheck();
    });
  }

  applyFilters() {
    let result = [...this.expenses];
    if (this.filterCategory) result = result.filter(e => e.categoryId === this.filterCategory);
    this.filteredExpenses = result;
    this.cdr.markForCheck();
  }

  getPaidAmount(expense: Expense): number {
    return this.currentMonthPayments
      .filter(p => p.expenseId === expense.id)
      .reduce((sum, p) => sum + Number(p.amountPaid), 0);
  }

  isPaidFull(expense: Expense): boolean {
    return this.getPaidAmount(expense) >= Number(expense.amount) - 0.01;
  }

  isPaidPartial(expense: Expense): boolean {
    const paid = this.getPaidAmount(expense);
    return paid > 0 && paid < Number(expense.amount) - 0.01;
  }

  togglePayment(expense: Expense) {
    // Si ya está pagado completo, se podría permitir desmarcar o ver detalles.
    // Para no complicarlo mucho, simplemente vemos si hay pagos míos para desmarcar, o mostramos un Toast.
    // Vamos a permitir abrir el dialogo si NO está full pagado.
    if (this.isPaidFull(expense)) {
      // Buscar MIS pagos
      const myPayment = this.currentMonthPayments.find(p => p.expenseId === expense.id && p.paidById === this.meId);
      if (myPayment) {
        this.paymentsService.delete(myPayment.id).subscribe(() => {
          this.loadPayments();
          this.snackBar.open('Tu pago fue desmarcado', 'OK', { duration: 2000 });
        });
      } else {
        this.snackBar.open('Este gasto ya está pagado por otro', 'OK', { duration: 2000 });
      }
      return;
    }

    const amountRemaining = Number(expense.amount) - this.getPaidAmount(expense);

    const dialogRef = this.dialog.open(PaymentModalComponent, {
      width: '450px',
      panelClass: 'custom-dialog-container',
      data: {
        expenseName: expense.name,
        amountRemaining: amountRemaining,
        amountTotal: expense.amount
      }
    });

    dialogRef.afterClosed().subscribe(customAmount => {
      if (customAmount && customAmount > 0) {
        this.paymentsService.create({
          expenseId: expense.id,
          year: this.currentYear,
          month: this.currentMonth,
          amountPaid: customAmount,
        }).subscribe({
          next: () => {
            this.loadPayments();
            this.snackBar.open('Pago parcial/total registrado', 'OK', { duration: 2000 });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al registrar', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteExpense(expense: Expense) {
    if (!confirm(`¿Eliminar "${expense.name}"?`)) return;
    this.expensesService.delete(expense.id).subscribe(() => {
      this.loadExpenses();
      this.snackBar.open('Gasto eliminado', 'OK', { duration: 2000 });
    });
  }

  getSplitBadge(item: Expense): { text: string, class: string } | null {
    if (!item.workspaceId) return null;
    if (item.splitType === 'EQUAL') return { text: 'Mitad', class: 'badge-shared' };
    if (item.splitType === 'INDIVIDUAL') {
      if (item.assignedUserId === this.meId) return { text: 'Mío', class: 'badge-mine' };
      return { text: 'De él/ella', class: 'badge-other' };
    }
    return null;
  }
}
