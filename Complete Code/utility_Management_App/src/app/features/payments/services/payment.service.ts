import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  // Backend supports: paymentMethod, fromDate, toDate filters
  getAll(pageNumber = 1, pageSize = 10, paymentMethod?: string, fromDate?: string, toDate?: string): Observable<PagedResponse<any>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (paymentMethod) params = params.set('paymentMethod', paymentMethod);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<PagedResponse<any>>(this.apiUrl, { params });
  }

  getMyPayments(): Observable<PagedResponse<any>> {
    return this.http.get<PagedResponse<any>>(`${this.apiUrl}/my-payments`);
  }

  record(payment: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, payment);
  }

  payMyBill(payment: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/pay-my-bill`, payment);
  }
}
