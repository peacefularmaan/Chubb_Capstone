import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  Bill, 
  BillListItem,
  GenerateBillRequest, 
  GenerateBulkBillsRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class BillsService {
  private apiUrl = `${environment.apiUrl}/bills`;

  constructor(private http: HttpClient) {}

  getAll(params?: PaginationParams & { status?: string; billingMonth?: number; billingYear?: number }): Observable<PagedResponse<BillListItem>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params?.sortBy) httpParams = httpParams.set('SortBy', params.sortBy);
    if (params?.sortDescending) httpParams = httpParams.set('SortDescending', params.sortDescending.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.billingMonth) httpParams = httpParams.set('billingMonth', params.billingMonth.toString());
    if (params?.billingYear) httpParams = httpParams.set('billingYear', params.billingYear.toString());
    return this.http.get<PagedResponse<BillListItem>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.apiUrl}/${id}`);
  }

  getMyBills(): Observable<ApiResponse<BillListItem[]>> {
    return this.http.get<ApiResponse<BillListItem[]>>(`${this.apiUrl}/my-bills`);
  }

  getMyBillById(id: number): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.apiUrl}/my-bills/${id}`);
  }

  generate(payload: GenerateBillRequest): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(`${this.apiUrl}/generate`, payload);
  }

  generateBulk(payload: GenerateBulkBillsRequest): Observable<ApiResponse<Bill[]>> {
    return this.http.post<ApiResponse<Bill[]>>(`${this.apiUrl}/generate-bulk`, payload);
  }
}
