import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  TariffPlan, 
  CreateTariffPlanRequest, 
  UpdateTariffPlanRequest 
} from '../models';

@Injectable({ providedIn: 'root' })
export class TariffPlansService {
  private apiUrl = `${environment.apiUrl}/tariffplans`;

  constructor(private http: HttpClient) {}

  // Backend supports: isActive, utilityTypeId query params
  getAll(isActive?: boolean, utilityTypeId?: number): Observable<ApiResponse<TariffPlan[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());
    if (utilityTypeId !== undefined) params = params.set('utilityTypeId', utilityTypeId.toString());
    return this.http.get<ApiResponse<TariffPlan[]>>(this.apiUrl, { params });
  }

  create(payload: CreateTariffPlanRequest): Observable<ApiResponse<TariffPlan>> {
    return this.http.post<ApiResponse<TariffPlan>>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateTariffPlanRequest): Observable<ApiResponse<TariffPlan>> {
    return this.http.put<ApiResponse<TariffPlan>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
