import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  DateRangeParams,
  Payment, 
  PaymentListItem,
  CreatePaymentRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getAll(params?: PaginationParams & DateRangeParams & { paymentMethod?: string }): Observable<PagedResponse<PaymentListItem>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params?.sortBy) httpParams = httpParams.set('SortBy', params.sortBy);
    if (params?.sortDescending) httpParams = httpParams.set('SortDescending', params.sortDescending.toString());
    if (params?.paymentMethod) httpParams = httpParams.set('paymentMethod', params.paymentMethod);
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get<PagedResponse<PaymentListItem>>(this.apiUrl, { params: httpParams });
  }

  getMyPayments(): Observable<ApiResponse<PaymentListItem[]>> {
    return this.http.get<ApiResponse<PaymentListItem[]>>(`${this.apiUrl}/my-payments`);
  }

  create(payload: CreatePaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(this.apiUrl, payload);
  }

  // Consumer pays their own bill
  payMyBill(payload: CreatePaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(`${this.apiUrl}/pay-my-bill`, payload);
  }
}
