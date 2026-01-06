import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private apiUrl = `${environment.apiUrl}/connections`;

  constructor(private http: HttpClient) {}

  // Backend supports: utilityTypeId, status filters
  getAll(pageNumber = 1, pageSize = 10, utilityTypeId?: number, status?: string): Observable<PagedResponse<any>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (utilityTypeId) params = params.set('utilityTypeId', utilityTypeId.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PagedResponse<any>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  create(connection: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, connection);
  }

  update(id: number, connection: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, connection);
  }

  getMyConnections(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/my-connections`);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
