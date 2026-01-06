import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  // Uses the reports/dashboard endpoint which exists in backend
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard`);
  }

  // Note: recent-activity endpoint does not exist in backend
  // Components using this should handle the 404 gracefully or use reports data
}
