import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth';
import { ThemeService } from './services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private _theme = inject(ThemeService); // eager-init theme on app boot

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.getMe().subscribe({
        next: (profile) => this.authService.currentUser.set(profile),
        error: () => this.authService.clearSession(),
      });
    }
  }
}
