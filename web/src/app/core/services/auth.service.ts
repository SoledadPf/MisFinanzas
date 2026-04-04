import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = `${environment.apiUrl}/auth`;
  private TOKEN_KEY = 'mf_token';
  private USER_KEY = 'mf_user';

  // Signals para estado reactivo
  private _user = signal<UserProfile | null>(this.getStoredUser());
  user = this._user.asReadonly();
  isAuthenticated = computed(() => !!this._user());

  constructor(private http: HttpClient, private router: Router) {}

  login(data: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.api}/login`, data).pipe(
      tap((res) => this.handleAuth(res)),
    );
  }

  register(data: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.api}/register`, data).pipe(
      tap((res) => this.handleAuth(res)),
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.api}/forgot-password`, { email });
  }

  verifyResetToken(data: { email: string; token: string }) {
    return this.http.post<{ message: string }>(`${this.api}/verify-reset-token`, data);
  }

  resetPassword(data: any) {
    return this.http.post<{ message: string }>(`${this.api}/reset-password`, data);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private getStoredUser(): UserProfile | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}
