import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private api = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.api);
  }

  create(data: { name: string; icon: string; color: string }): Observable<Category> {
    return this.http.post<Category>(this.api, data);
  }
}
