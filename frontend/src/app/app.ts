import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private authService = inject(AuthService);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.getMe().subscribe({
        next: (profile) => this.authService.currentUser.set(profile),
        error: () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        },
      });
    }
  }
}
