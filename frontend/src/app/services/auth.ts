import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthCredentials, AuthResponse } from '../models/auth.models';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';

  register(credentials: AuthCredentials) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, credentials);
  }

  login(credentials: AuthCredentials) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
      }),
    );
  }

  logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).pipe(
      tap(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }),
    );
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
        }),
      );
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
