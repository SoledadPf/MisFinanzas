import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../core/services/expenses.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { WorkspacesService } from '../../../core/services/workspaces.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
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

          <!-- GRUPO -->
          <div class="field-group">
            <label class="field-label" for="workspaceId">Grupo</label>
            <div class="input-wrap select-wrap">
              <mat-icon class="field-icon">group</mat-icon>
              <select id="workspaceId" [(ngModel)]="formWorkspaceId" name="workspaceId" (ngModelChange)="onWorkspaceChange($event)">
                <option value="">Sin grupo (Personal)</option>
                @for (uw of workspacesService.workspaces(); track uw.workspaceId) {
                  <option [value]="uw.workspaceId">{{ uw.workspace.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- REGLA DE DIVISIÓN — solo si hay grupo seleccionado -->
          @if (formWorkspaceId && groupMembers().length > 0) {
            <div class="field-group">
              <label class="field-label">¿A quién le corresponde pagar esto?</label>
              <div class="type-toggle split-toggle">
                <button type="button" class="type-btn" [class.active]="formSplitType === 'INDIVIDUAL' && formAssignedUserId === meId"
                        (click)="setSplitType('INDIVIDUAL', meId)">
                  <mat-icon>person</mat-icon>
                  Mío
                </button>
                <button type="button" class="type-btn" [class.active]="formSplitType === 'EQUAL'"
                        (click)="setSplitType('EQUAL', '')">
                  <mat-icon>people</mat-icon>
                  Compartido 50/50
                </button>
              </div>
              <div class="type-toggle split-toggle" style="margin-top: 8px;">
                @for (member of groupMembers(); track member.id) {
                  @if (member.id !== meId) {
                    <button type="button" class="type-btn" [class.active]="formSplitType === 'INDIVIDUAL' && formAssignedUserId === member.id"
                            (click)="setSplitType('INDIVIDUAL', member.id)">
                      <mat-icon>person_outline</mat-icon>
                      De {{ member.name.split(' ')[0] }}
                    </button>
                  }
                }
              </div>
            </div>
          }

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
  formWorkspaceId = ''; // '' = Personal (sin grupo)

  // Campos compartidos
  formSplitType: 'INDIVIDUAL' | 'EQUAL' = 'INDIVIDUAL';
  formAssignedUserId = '';
  meId = '';
  
  groupMembers = signal<any[]>([]);

  isEditing = false;
  editId = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private expensesService: ExpensesService,
    private categoriesService: CategoriesService,
    public workspacesService: WorkspacesService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // Set default date to today
    this.formDate = new Date().toISOString().split('T')[0];

    // Leer usuario logueado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.meId = JSON.parse(userStr).id;
      this.formAssignedUserId = this.meId;
    }

    // Load categories
    this.categoriesService.getAll().subscribe(cats => {
      this.categories.set(cats);
      this.cdr.markForCheck();
    });

    // Preseleccionar el workspace activo en nuevos gastos
    const ws = this.workspacesService.activeWorkspace();
    if (ws && !this.route.snapshot.paramMap.get('id')) {
      this.formWorkspaceId = ws.id;
      this.loadMembersForWorkspace(ws.id);
    }

    // Cargar workspaces si no están cargados
    if (this.workspacesService.workspaces().length === 0) {
      this.workspacesService.loadWorkspaces().subscribe();
    }

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
        this.formSplitType  = (expense as any).splitType || 'INDIVIDUAL';
        this.formAssignedUserId = (expense as any).assignedUserId || this.meId;
        this.formWorkspaceId = (expense as any).workspaceId || '';

        // Si tiene grupo, cargar sus miembros
        if (this.formWorkspaceId) {
          this.loadMembersForWorkspace(this.formWorkspaceId);
        }

        if (expense.date) {
          this.formDate = expense.date.split('T')[0];
        }
        this.cdr.markForCheck();
      });
    }
  }

  loadMembersForWorkspace(workspaceId: string) {
    this.http.get<any[]>(`${environment.apiUrl}/workspaces/${workspaceId}/members`).subscribe(m => {
      this.groupMembers.set(m);
      this.cdr.markForCheck();
    });
  }

  onWorkspaceChange(workspaceId: string) {
    this.formWorkspaceId = workspaceId;
    this.groupMembers.set([]);
    this.formSplitType = 'INDIVIDUAL';
    this.formAssignedUserId = this.meId;
    if (workspaceId) {
      this.loadMembersForWorkspace(workspaceId);
    }
  }

  setType(type: 'fixed' | 'variable') {
    this.formType = type;
  }

  setSplitType(splitType: 'INDIVIDUAL' | 'EQUAL', assignedUserId: string) {
    this.formSplitType = splitType;
    this.formAssignedUserId = assignedUserId;
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
      workspaceId: this.formWorkspaceId || null,
      splitType:   this.formWorkspaceId ? this.formSplitType : 'INDIVIDUAL',
      assignedUserId: this.formWorkspaceId ? this.formAssignedUserId : this.meId,
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
