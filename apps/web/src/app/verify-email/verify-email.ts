import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  loading = signal(true);
  success = signal(false);
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set('No verification token provided.');
      return;
    }
    try {
      await this.authService.verifyEmail(token);
      await this.authService.refreshUser();
      this.success.set(true);
    } catch {
      this.error.set('Invalid or expired verification token.');
    } finally {
      this.loading.set(false);
    }
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
}
