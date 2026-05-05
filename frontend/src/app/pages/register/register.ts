import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { RegisterCredentials } from '../../models/auth.models';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password === confirmPassword ? null : { mismatch: true };
};

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup(
    {
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator },
  );

  errorMessage = signal('');

  onSubmit(): void {
    if (this.form.invalid) {
      if (this.form.hasError('mismatch')) {
        this.errorMessage.set('Passwords do not match.');
      } else {
        this.errorMessage.set('Please fill out all fields correctly.');
      }
      return;
    }

    this.errorMessage.set('');
    const credentials: RegisterCredentials = {
      firstName: this.form.value.firstName as string,
      lastName: this.form.value.lastName as string,
      email: this.form.value.email as string,
      password: this.form.value.password as string,
    };

    this.auth.register(credentials).subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        console.error('Registration error:', err);
        if (err.status === 0) {
          this.errorMessage.set('Unable to connect to the server. Is the backend running?');
        } else {
          this.errorMessage.set(
            err.error?.message || err.message || 'Something went wrong. Please try again.',
          );
        }
      },
    });
  }
}
