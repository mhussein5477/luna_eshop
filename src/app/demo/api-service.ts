import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators'; 

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'api.lunapackagingltd.co.ke';

  constructor(private http: HttpClient) {}

  // Get auth headers with bearer token
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Auth methods
  login(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/signIn`, payload);
  }

  // Verify MFA OTP during login
  verifyMfaLogin(payload: { emailAddress: string; otp: number }, mfaToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Mfa-Token': mfaToken
    });
    return this.http.post(`${this.baseUrl}/auth/verify`, payload, { headers });
  }

  forgotPassword(emailAddress: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgotPassword?emailAddress=${emailAddress}`, {});
  }

  verifyOtp(payload: { emailAddress: string; otp: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot/verifyOtp`, payload);
  }

  // Change password with bearer token (for logged-in users in settings)
  changePasswordWithBearerToken(payload: { emailAddress: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/changePassword`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  // Change password with token (for password reset flow after OTP verification)
  changePasswordWithToken(payload: { emailAddress: string; password: string }, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.baseUrl}/user/changePassword`, payload, { headers });
  }

  // Client methods
  createClient(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/clients`, payload);
  }

  updateClient(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/clients`, payload);
  }

  searchClients(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/clients/search`, payload);
  }

  getClientById(clientId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/clients/${clientId}`);
  }

  changeStatus(clientId: string, status: string) {
    return this.http.post(
      `${this.baseUrl}/clients/changeStatus/${clientId}?status=${status}`,
      {}
    );
  }

  // Upload client logo
  uploadClientLogo(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/clients/uploadLogo`, formData);
  }

  // User methods
  searchUsers(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/search`, payload);
  }

  updateUser(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/user`, payload);
  }

  // Product methods
  createProduct(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/product`, payload);
  }

  updateProduct(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/product`, payload);
  }

  searchProducts(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/product/search`, payload);
  }

  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/product/${id}`);
  }

  uploadProductImages(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/product/uploadImages`, formData);
  }

  // Change product status
  changeProductStatus(productId: string, status: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/product/changeStatus/${productId}?status=${status}`,
      {}
    );
  }

  // Product Category methods
  createProductCategory(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/productCategory`, payload);
  }

  updateProductCategory(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/productCategory`, payload);
  }

  searchProductCategories(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/productCategory/search`, payload);
  }

  getProductCategoryById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/productCategory/${id}`);
  }

  // Order methods
  createOrder(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/order`, payload);
  }

  searchOrders(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/order/search`, payload);
  }

  getOrderById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/order/${id}`);
  }

  downloadCatalogue(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/product/catalogue/pdf?clientId=${id}`, {
      responseType: 'blob' // ⭐ KEY FIX: Specify response type as blob
    });
  }

  changeOrderStatus(
    orderId: string,
    payload: {
      status: string;
      paymentMethod?: string;
      paymentReference?: string;
      shippingProvider?: string;
      trackingNumber?: string;
    }
  ): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/order/changeStatus/${orderId}`,
      payload
    );
  }

  // Order Items methods
  searchOrderItems(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orderItem/search`, payload);
  }

  getAllClients(): Observable<any> {
    const payload = {
      pageNo: 0,
      pageSize: 1000,
      sortBy: 'name',
      sortDir: 'ASC',
      name: '',
      emailAddress: '',
      phoneNumber: ''
    };
    return this.http.post(`${this.baseUrl}/clients/search`, payload);
  }
}