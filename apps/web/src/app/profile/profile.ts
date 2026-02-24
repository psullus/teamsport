import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  constructor(private authService: AuthService) {}

  get user() {
    return this.authService.user;
  }

  userInitials(): string {
    return this.authService.getUserInitials();
  }
}
