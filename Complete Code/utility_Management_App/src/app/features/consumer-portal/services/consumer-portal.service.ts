import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models';

/**
 * Consumer Portal Service - redirects to existing API endpoints
 * There is no /consumer-portal controller in backend, so we use:
 * - /consumers/my-profile for profile
 * - /bills/my-bills for bills
 * - /payments/my-payments for payments
 */
@Injectable({ providedIn: 'root' })
export class ConsumerPortalService {
  private consumersUrl = `${environment.apiUrl}/consumers`;
  private billsUrl = `${environment.apiUrl}/bills`;
  private paymentsUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.consumersUrl}/my-profile`);
  }

  updateProfile(profile: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.consumersUrl}/my-profile`, profile);
  }

  getBills(): Observable<PagedResponse<any>> {
    return this.http.get<PagedResponse<any>>(`${this.billsUrl}/my-bills`);
  }

  getPayments(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.paymentsUrl}/my-payments`);
  }
}
