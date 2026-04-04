import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, CreatePaymentRequest } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private api = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getByMonth(year: number, month: number): Observable<Payment[]> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());
    return this.http.get<Payment[]>(this.api, { params });
  }

  getByExpense(expenseId: string, year: number): Observable<Payment[]> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<Payment[]>(`${this.api}/expense/${expenseId}`, { params });
  }

  create(data: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.api, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
