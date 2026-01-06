import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class MeterReadingService {
  private apiUrl = `${environment.apiUrl}/meterreadings`;

  constructor(private http: HttpClient) {}

  // Backend supports: billingMonth, billingYear filters
  getAll(pageNumber = 1, pageSize = 10, billingMonth?: number, billingYear?: number): Observable<PagedResponse<any>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (billingMonth) params = params.set('billingMonth', billingMonth.toString());
    if (billingYear) params = params.set('billingYear', billingYear.toString());

    return this.http.get<PagedResponse<any>>(this.apiUrl, { params });
  }

  getUnbilled(billingMonth?: number, billingYear?: number): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (billingMonth) params = params.set('billingMonth', billingMonth.toString());
    if (billingYear) params = params.set('billingYear', billingYear.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/unbilled`, { params });
  }

  getLastReading(connectionId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/last-reading/${connectionId}`);
  }

  getById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  create(reading: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, reading);
  }

  update(id: number, reading: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, reading);
  }

  getByConnection(connectionId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/connection/${connectionId}`);
  }
}
