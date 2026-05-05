import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AuthCredentials, AuthResponse, RegisterCredentials, UserProfile } from '../models/auth.models';
import { switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';

  currentUser = signal<UserProfile | null>(null);

  getMe() {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  register(credentials: RegisterCredentials) {
    return this.http
      .post<void>(`${this.apiUrl}/register`, credentials)
      .pipe(switchMap(() => this.login({ email: credentials.email, password: credentials.password })));
  }

  login(credentials: AuthCredentials) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.storeTokens(response)),
      switchMap(() => this.getMe()),
      tap((profile) => this.currentUser.set(profile)),
    );
  }

  logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    this.clearSession();
    return this.http.post(`${this.apiUrl}/logout`, { refresh_token: refreshToken });
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken })
      .pipe(tap((response) => this.storeTokens(response)));
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser.set(null);
  }

  private storeTokens(response: AuthResponse) {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
  }
}
