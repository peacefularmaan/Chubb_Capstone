import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private authUrl = `${environment.apiUrl}/auth`;
  private utilityTypesUrl = `${environment.apiUrl}/utilitytypes`;
  private tariffPlansUrl = `${environment.apiUrl}/tariffplans`;
  private billingCyclesUrl = `${environment.apiUrl}/billingcycles`;

  constructor(private http: HttpClient) {}

  // User management - backend has GET /auth/users, PUT /auth/users/{id}, DELETE /auth/users/{id}
  // For creating staff users, use POST /auth/register-staff
  getUsers(pageNumber = 1, pageSize = 10): Observable<PagedResponse<any>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<any>>(`${this.authUrl}/users`, { params });
  }

  // Note: GET /auth/users/{id} does not exist - remove getUser method
  // Use register-staff to create new staff users
  createStaffUser(user: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.authUrl}/register-staff`, user);
  }

  updateUser(id: number, user: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.authUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.authUrl}/users/${id}`);
  }

  getUtilityTypes(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.utilityTypesUrl);
  }

  createUtilityType(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.utilityTypesUrl, payload);
  }

  updateUtilityType(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.utilityTypesUrl}/${id}`, payload);
  }

  deleteUtilityType(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.utilityTypesUrl}/${id}`);
  }

  getTariffPlans(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.tariffPlansUrl);
  }

  createTariffPlan(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.tariffPlansUrl, payload);
  }

  updateTariffPlan(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.tariffPlansUrl}/${id}`, payload);
  }

  deleteTariffPlan(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.tariffPlansUrl}/${id}`);
  }

  getBillingCycles(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.billingCyclesUrl);
  }

  getCurrentBillingCycle(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.billingCyclesUrl}/current`);
  }

  createBillingCycle(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.billingCyclesUrl, payload);
  }

  updateBillingCycle(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.billingCyclesUrl}/${id}`, payload);
  }
}
