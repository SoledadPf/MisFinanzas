import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../core/services/expenses.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { Expense, Category, Payment } from '../../../core/models/interfaces';

const MONTHS_FULL = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
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
          <div class="expense-item" [class.is-paid]="isCurrentMonthPaid(expense)">
            <div class="expense-left">
              <button class="check-box" [class.checked]="isCurrentMonthPaid(expense)"
                      (click)="togglePayment(expense)">
                @if (isCurrentMonthPaid(expense)) {
                  <mat-icon>check</mat-icon>
                }
              </button>
              <div class="expense-icon-wrap">
                {{ expense.category?.icon }}
              </div>
              <div class="expense-info">
                <span class="expense-name" [class.paid-text]="isCurrentMonthPaid(expense)">
                  {{ expense.name }}
                </span>
                <span class="expense-meta">
                  {{ expense.category?.name }} · Día {{ expense.dueDay }}
                </span>
              </div>
            </div>
            <div class="expense-right">
              <span class="expense-amount" [class.paid-amount]="isCurrentMonthPaid(expense)">
                S/ {{ expense.amount | number:'1.2-2' }}
              </span>
              <button class="icon-btn" (click)="deleteExpense(expense)">
                <mat-icon>delete_outline</mat-icon>
              </button>
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
                <span class="expense-name">{{ expense.name }}</span>
                <span class="expense-meta">
                  {{ expense.category?.name }} · {{ expense.date | date:'yyyy-MM-dd' }}
                </span>
              </div>
            </div>
            <div class="expense-right">
              <span class="expense-amount variable-amount">
                S/ {{ expense.amount | number:'1.2-2' }}
              </span>
              <button class="icon-btn" (click)="deleteExpense(expense)">
                <mat-icon>delete_outline</mat-icon>
              </button>
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

  constructor(
    private expensesService: ExpensesService,
    private categoriesService: CategoriesService,
    private paymentsService: PaymentsService,
    private snackBar: MatSnackBar,
    public router: Router,
  ) {}

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
    this.expensesService.getAll(type).subscribe(data => {
      this.expenses = data;
      this.applyFilters();
    });
  }

  loadPayments() {
    this.paymentsService.getByMonth(this.currentYear, this.currentMonth).subscribe(data => {
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

  isCurrentMonthPaid(expense: Expense): boolean {
    return this.currentMonthPayments.some(p => p.expenseId === expense.id);
  }

  togglePayment(expense: Expense) {
    const existing = this.currentMonthPayments.find(p => p.expenseId === expense.id);
    if (existing) {
      this.paymentsService.delete(existing.id).subscribe(() => {
        this.loadPayments();
        this.snackBar.open('Pago desmarcado', 'OK', { duration: 2000 });
      });
    } else {
      this.paymentsService.create({
        expenseId: expense.id,
        year: this.currentYear,
        month: this.currentMonth,
        amountPaid: Number(expense.amount),
      }).subscribe(() => {
        this.loadPayments();
        this.snackBar.open('Marcado como pagado', 'OK', { duration: 2000 });
      });
    }
  }

  deleteExpense(expense: Expense) {
    if (!confirm(`¿Eliminar "${expense.name}"?`)) return;
    this.expensesService.delete(expense.id).subscribe(() => {
      this.loadExpenses();
      this.snackBar.open('Gasto eliminado', 'OK', { duration: 2000 });
    });
  }
}
