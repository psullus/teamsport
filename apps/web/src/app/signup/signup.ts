import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup implements OnInit {
  organisationName = '';
  email = '';
  password = '';
  error = '';
  inviteToken: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.inviteToken = this.route.snapshot.queryParamMap.get('invite');
  }

  async onSubmit() {
    this.error = '';
    try {
      if (this.inviteToken) {
        await this.authService.signupWithInvite(this.email, this.password, this.inviteToken);
      } else {
        await this.authService.signup(this.organisationName, this.email, this.password);
      }
    } catch (err: any) {
      this.error = err?.error?.message || 'Signup failed. Please try again.';
    }
  }
}
