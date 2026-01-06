import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private apiUrl = `${environment.apiUrl}/bills`;

  constructor(private http: HttpClient) {}

  // Backend supports: status, billingMonth, billingYear filters
  getAll(pageNumber = 1, pageSize = 10, status?: string, billingMonth?: number, billingYear?: number): Observable<PagedResponse<any>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (billingMonth) params = params.set('billingMonth', billingMonth.toString());
    if (billingYear) params = params.set('billingYear', billingYear.toString());

    return this.http.get<PagedResponse<any>>(this.apiUrl, { params });
  }

  getMyBills(): Observable<PagedResponse<any>> {
    return this.http.get<PagedResponse<any>>(`${this.apiUrl}/my-bills`);
  }

  getById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  generate(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/generate`, payload);
  }

  generateBulk(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/generate-bulk`, payload);
  }
}
