import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary, CategoryBreakdown, MonthlyTrend, UpcomingPayment } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(year: number, month: number, workspaceId?: string): Observable<DashboardSummary> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());
    if (workspaceId) params = params.set('workspaceId', workspaceId);
    return this.http.get<DashboardSummary>(`${this.api}/summary`, { params });
  }

  getByCategory(year: number, month: number, workspaceId?: string): Observable<CategoryBreakdown[]> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());
    if (workspaceId) params = params.set('workspaceId', workspaceId);
    return this.http.get<CategoryBreakdown[]>(`${this.api}/by-category`, { params });
  }

  getTrend(year: number, workspaceId?: string): Observable<MonthlyTrend[]> {
    let params = new HttpParams().set('year', year.toString());
    if (workspaceId) params = params.set('workspaceId', workspaceId);
    return this.http.get<MonthlyTrend[]>(`${this.api}/trend`, { params });
  }

  getUpcoming(year: number, month: number, workspaceId?: string): Observable<UpcomingPayment[]> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());
    if (workspaceId) params = params.set('workspaceId', workspaceId);
    return this.http.get<UpcomingPayment[]>(`${this.api}/upcoming`, { params });
  }
}
