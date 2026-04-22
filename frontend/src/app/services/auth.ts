import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AuthCredentials, AuthResponse, UserProfile } from '../models/auth.models';
import { switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';

  currentUser = signal<UserProfile | null>(null);

  // Method to fetch the current user's profile
  getMe() {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  // Registration method
  register(credentials: AuthCredentials) {
    return this.http
      .post<void>(`${this.apiUrl}/register`, credentials)
      .pipe(switchMap(() => this.login(credentials)));
  }

  // Login method that stores tokens in localStorage and updates the current user profile
  login(credentials: AuthCredentials) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
      }),
      switchMap(() => this.getMe()),
      tap((profile) => this.currentUser.set(profile)),
    );
  }

  // Logout method that removes tokens from localStorage
  logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).pipe(
      tap(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.currentUser.set(null);
      }),
    );
  }

  // Method to refresh access token using the refresh token
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

  // Method to check if the user is logged in based on the presence of an access token
  isLoggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  // Method to get the current access token
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
