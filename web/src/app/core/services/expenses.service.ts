import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private api = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getAll(type?: string): Observable<Expense[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<Expense[]>(this.api, { params });
  }

  getById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.api}/${id}`);
  }

  create(data: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.api, data);
  }

  update(id: string, data: UpdateExpenseRequest): Observable<Expense> {
    return this.http.patch<Expense>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
