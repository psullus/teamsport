import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  error = '';

  constructor(private authService: AuthService) {}

  async onSubmit() {
    this.error = '';
    try {
      await this.authService.login(this.email, this.password);
    } catch (err: any) {
      this.error = err?.error?.message || 'Login failed. Please try again.';
    }
  }
}
