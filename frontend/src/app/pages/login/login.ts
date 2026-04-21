import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { AuthCredentials } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  errorMessage = signal('');

  onSubmit(): void {
    if (this.form.invalid) return;

    this.errorMessage.set('');
    const credentials: AuthCredentials = {
      email: this.form.value.email as string,
      password: this.form.value.password as string,
    };

    this.auth.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        console.error('Login error:', err);
        if (err.status === 0) {
          this.errorMessage.set('Unable to connect to the server. Is the backend running?');
        } else {
          this.errorMessage.set(
            err.error?.message || err.message || 'Login failed. Please try again.',
          );
        }
      },
    });
  }
}
