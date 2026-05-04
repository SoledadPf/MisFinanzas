// ===== AUTH =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: UserProfile;
  access_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

// ===== CATEGORIES =====
export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string;
  color: string;
}

// ===== EXPENSES =====
export interface Expense {
  id: string;
  userId: string;
  workspaceId?: string;
  splitType: string;
  assignedUserId?: string;
  categoryId: string;
  name: string;
  amount: number;
  type: 'fixed' | 'variable';
  dueDay: number | null;
  date: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  category: Category;
  payments?: Payment[];
}

export interface CreateExpenseRequest {
  name: string;
  amount: number;
  categoryId: string;
  type: 'fixed' | 'variable';
  workspaceId?: string | null;
  splitType?: string;
  assignedUserId?: string | null;
  dueDay?: number;
  date?: string;
  notes?: string;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {}

// ===== PAYMENTS =====
export interface Payment {
  id: string;
  expenseId: string;
  paidById?: string;
  year: number;
  month: number;
  paidAt: string | null;
  amountPaid: number;
  expense?: Expense;
}

export interface CreatePaymentRequest {
  expenseId: string;
  year: number;
  month: number;
  amountPaid: number;
}

// ===== DASHBOARD =====
export interface DashboardSummary {
  totalFixed: number;
  totalVariable: number;
  totalMonth: number;
  totalPaid: number;
  totalPending: number;
  month: number;
  year: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
}

export interface MonthlyTrend {
  name: string;
  month: number;
  fixed: number;
  variable: number;
  total: number;
}

export interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  remaining: number;
  dueDay: number;
  category: Category;
}
