import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, SPORT_TYPES } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup implements OnInit {
  organisationName = '';
  clubName = '';
  clubType = 'Touch';
  teamName = '';
  email = '';
  password = '';
  error = signal('');
  inviteToken: string | null = null;
  sportTypes = SPORT_TYPES;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.inviteToken = this.route.snapshot.queryParamMap.get('invite');
  }

  async onSubmit() {
    this.error.set('');
    try {
      if (this.inviteToken) {
        await this.authService.signupWithInvite(this.email, this.password, this.inviteToken);
      } else {
        await this.authService.signup(
          this.organisationName, this.email, this.password,
          this.clubName, this.clubType, this.teamName,
        );
      }
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Signup failed. Please try again.');
    }
  }
}
