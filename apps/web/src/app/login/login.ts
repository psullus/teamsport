import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  error = signal('');
  showPassword = signal(false);

  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/');
      }
    });
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  async onSubmit() {
    this.error.set('');
    try {
      await this.authService.login(this.email, this.password);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Login failed. Please try again.');
    }
  }
}
