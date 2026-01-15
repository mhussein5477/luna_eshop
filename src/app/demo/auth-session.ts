import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export interface JwtUser {
  emailAddress: string;
  phoneNumber: string;
  role: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  fullName: string;
  clientPhoneNumber: string;
  isWhatsappOrder: number;
  isPortalOrder: number;
}

export interface JwtPayload {
  sub: string;
  user: JwtUser;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {

  private readonly TOKEN_KEY = 'auth_token';

  // 🔹 Get raw token
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // 🔹 Decode token safely
  private decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Invalid JWT token', error);
      return null;
    }
  }

  // 🔹 User object
  get user(): JwtUser | null {
    return this.decodeToken()?.user || null;
  }

  // 🔹 Individual getters (easy access anywhere)

  get email(): string | null {
    return this.decodeToken()?.user?.emailAddress || null;
  }

  get fullName(): string | null {
    return this.decodeToken()?.user?.fullName || null;
  }

  get clientId(): string | null {
    return this.decodeToken()?.user?.clientId || null;
  }

  get clientName(): string | null {
    return this.decodeToken()?.user?.clientName || null;
  }

  get phoneNumber(): string | null {
    return this.decodeToken()?.user?.phoneNumber || null;
  }

  // 🔹 User role
  get role(): string | null {
    return this.decodeToken()?.user?.role || null;
  }

  // 🔹 Order type access
  get isWhatsappOrder(): boolean {
    return this.decodeToken()?.user?.isWhatsappOrder === 1;
  }

  get isPortalOrder(): boolean {
    return this.decodeToken()?.user?.isPortalOrder === 1;
  }

  // 🔹 Token expiry checks
  isTokenExpired(): boolean {
    const payload = this.decodeToken();
    if (!payload) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  // 🔹 Clear session
  logout(): void {
    sessionStorage.clear();
  }
}