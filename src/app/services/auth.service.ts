// src/app/servicios/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest } from '../dto/login-request';
import { TokenResponse } from '../dto/token-response';
import { ErrorResponse } from '../dto/error-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080';
  private readonly TOKEN_KEY = 'authToken';
  private readonly TOKEN_TYPE_KEY = 'tokenType';
  private readonly EXPIRE_AT_KEY = 'expireAt';
  private readonly ROLES_KEY = 'roles';
  private readonly USER_ID_KEY = 'userId';

  private loggedInStatus = new BehaviorSubject<boolean>(this.hasToken());
  loggedIn$ = this.loggedInStatus.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private hasToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expireAt = localStorage.getItem(this.EXPIRE_AT_KEY);
    if (!token || !expireAt) {
      return false;
    }
    return new Date(expireAt) > new Date();
  }

  login(request: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        this.storeToken(response);
        this.loggedInStatus.next(true);
      }),
      catchError(this.handleError)
    );
  }

  private storeToken(tokenResponse: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, tokenResponse.token);
    localStorage.setItem(this.TOKEN_TYPE_KEY, tokenResponse.type);
    localStorage.setItem(this.EXPIRE_AT_KEY, tokenResponse.expireAt.toString());
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(tokenResponse.roles));
    try {
      const payload = JSON.parse(atob(tokenResponse.token.split('.')[1]));
      if (payload.sub) {
        localStorage.setItem(this.USER_ID_KEY, payload.sub);
      }
    } catch (e) {
      console.error('Error decoding token', e);
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_TYPE_KEY);
    localStorage.removeItem(this.EXPIRE_AT_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    this.loggedInStatus.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean { // [cite: 106]
    return this.hasToken();
  }

  getToken(): string | null { // [cite: 21]
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getTokenType(): string | null {
    return localStorage.getItem(this.TOKEN_TYPE_KEY);
  }

  getRoles(): string[] { // [cite: 24]
    const roles = localStorage.getItem(this.ROLES_KEY);
    return roles ? JSON.parse(roles) : [];
  }

  getCurrentUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  isUserInRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido al intentar iniciar sesión.';
    if (error.status === 401 || error.status === 400) {
        if (error.error && error.error.message) {
            const errResponse = error.error as ErrorResponse;
            errorMessage = errResponse.message;
        } else {
            errorMessage = 'Credenciales inválidas o cuenta no activada.';
        }
    } else if (error.error && error.error.message) {
      const errResponse = error.error as ErrorResponse;
      errorMessage = `${errResponse.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error(error);
    return throwError(() => new Error(errorMessage));
  }

  // Método para la verificación de email (basado en SecurityController)
  verificarCuenta(token: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/auth/verified?token=${token}`, { responseType: 'text' });
  }
}