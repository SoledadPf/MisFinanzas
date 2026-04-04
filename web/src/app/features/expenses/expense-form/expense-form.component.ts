import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../core/services/expenses.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category, CreateExpenseRequest } from '../../../core/models/interfaces';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="form-page">
      <!-- Header -->
      <div class="form-header">
        <button class="back-btn" type="button" (click)="router.navigate(['/expenses'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditing ? 'Editar' : 'Nuevo' }} Gasto</h1>
      </div>

      <div class="form-card">
        <form (ngSubmit)="onSubmit()">

          <!-- Nombre -->
          <div class="field-group">
            <label class="field-label" for="name">Nombre del gasto *</label>
            <div class="input-wrap">
              <mat-icon class="field-icon">receipt_long</mat-icon>
              <input id="name" type="text" [(ngModel)]="formName" name="name" required
                     placeholder="Ej: Netflix, Pasajes, Almuerzo">
            </div>
          </div>

          <!-- Monto -->
          <div class="field-group">
            <label class="field-label" for="amount">Monto *</label>
            <div class="input-wrap">
              <span class="prefix">S/</span>
              <input id="amount" type="number" [(ngModel)]="formAmount" name="amount"
                     required min="0.01" step="0.10" placeholder="0.00">
            </div>
          </div>

          <!-- Categoría -->
          <div class="field-group">
            <label class="field-label" for="categoryId">Categoría *</label>
            <div class="input-wrap select-wrap">
              <mat-icon class="field-icon">category</mat-icon>
              <select id="categoryId" [(ngModel)]="formCategoryId" name="categoryId" required>
                <option value="">Selecciona una categoría</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.icon }} {{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Tipo -->
          <div class="field-group">
            <label class="field-label">Tipo de gasto</label>
            <div class="type-toggle">
              <button type="button" class="type-btn" [class.active]="formType === 'fixed'"
                      (click)="setType('fixed')">
                <mat-icon>repeat</mat-icon>
                Fijo
              </button>
              <button type="button" class="type-btn" [class.active]="formType === 'variable'"
                      (click)="setType('variable')">
                <mat-icon>trending_up</mat-icon>
                Variable
              </button>
            </div>
          </div>

          <!-- Día o Fecha -->
          @if (formType === 'fixed') {
            <div class="field-group">
              <label class="field-label" for="dueDay">Día de pago (1–31)</label>
              <div class="input-wrap">
                <mat-icon class="field-icon">event</mat-icon>
                <input id="dueDay" type="number" [(ngModel)]="formDueDay" name="dueDay"
                       min="1" max="31" placeholder="15">
              </div>
            </div>
          } @else {
            <div class="field-group">
              <label class="field-label" for="date">Fecha del gasto</label>
              <div class="input-wrap">
                <mat-icon class="field-icon">calendar_today</mat-icon>
                <input id="date" type="date" [(ngModel)]="formDate" name="date">
              </div>
            </div>
          }

          <!-- Notas -->
          <div class="field-group">
            <label class="field-label" for="notes">Notas (opcional)</label>
            <div class="input-wrap textarea-wrap">
              <mat-icon class="field-icon">notes</mat-icon>
              <textarea id="notes" [(ngModel)]="formNotes" name="notes" rows="2"
                        placeholder="Plan familiar, estimado mensual…"></textarea>
            </div>
          </div>

          <!-- Error -->
          @if (errorMsg()) {
            <div class="error-msg">
              <mat-icon>error_outline</mat-icon>
              {{ errorMsg() }}
            </div>
          }

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="cancel-btn" (click)="router.navigate(['/expenses'])">
              Cancelar
            </button>
            <button type="submit" class="submit-btn" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="18"></mat-spinner>
                Guardando…
              } @else {
                {{ isEditing ? 'Guardar Cambios' : 'Crear Gasto' }}
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styleUrl: './expense-form.component.scss',
})
export class ExpenseFormComponent implements OnInit {
  // Signals for reactive state (required for zoneless)
  loading = signal(false);
  errorMsg = signal('');
  categories = signal<Category[]>([]);

  // Plain properties for ngModel (avoids ExpressionChangedAfterChecked)
  formName = '';
  formAmount = 0;
  formCategoryId = '';
  formType: 'fixed' | 'variable' = 'fixed';
  formDueDay = 1;
  formDate = '';
  formNotes = '';

  isEditing = false;
  editId = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private expensesService: ExpensesService,
    private categoriesService: CategoriesService,
    private snackBar: MatSnackBar,
    public router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // Set default date to today
    this.formDate = new Date().toISOString().split('T')[0];

    // Load categories — use setTimeout to avoid ExpressionChangedAfterChecked in zoneless
    this.categoriesService.getAll().subscribe(cats => {
      this.categories.set(cats);
      this.cdr.markForCheck();
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.editId = id;
      this.expensesService.getById(id).subscribe(expense => {
        this.formName       = expense.name;
        this.formAmount     = Number(expense.amount);
        this.formCategoryId = expense.categoryId;
        this.formType       = expense.type as 'fixed' | 'variable';
        this.formDueDay     = expense.dueDay || 1;
        this.formNotes      = expense.notes || '';
        if (expense.date) {
          this.formDate = expense.date.split('T')[0];
        }
        this.cdr.markForCheck();
      });
    }
  }

  setType(type: 'fixed' | 'variable') {
    this.formType = type;
  }

  onSubmit() {
    if (!this.formName.trim() || !this.formAmount || !this.formCategoryId) {
      this.errorMsg.set('Completa los campos obligatorios');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const data: CreateExpenseRequest = {
      name:       this.formName.trim(),
      amount:     this.formAmount,
      categoryId: this.formCategoryId,
      type:       this.formType,
      notes:      this.formNotes,
    };

    if (this.formType === 'fixed') {
      data.dueDay = this.formDueDay;
    } else {
      data.date = this.formDate;
    }

    const request = this.isEditing
      ? this.expensesService.update(this.editId, data)
      : this.expensesService.create(data);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(this.isEditing ? 'Gasto actualizado' : '¡Gasto creado!', 'OK', { duration: 2000 });
        this.router.navigate(['/expenses']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Error al guardar. Revisa la conexión con la API.');
        this.cdr.markForCheck();
      },
    });
  }
}
