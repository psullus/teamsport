import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-verify-email-notice',
  imports: [RouterLink],
  templateUrl: './verify-email-notice.html',
  styleUrl: './verify-email-notice.css',
})
export class VerifyEmailNotice {
  resending = signal(false);
  resent = signal(false);
  error = signal('');

  constructor(private authService: AuthService) {}

  async resend() {
    this.resending.set(true);
    this.error.set('');
    this.resent.set(false);
    try {
      await this.authService.resendVerification();
      this.resent.set(true);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to resend verification email.');
    } finally {
      this.resending.set(false);
    }
  }
}
