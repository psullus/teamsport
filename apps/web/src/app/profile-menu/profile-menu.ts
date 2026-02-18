import { Component, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile-menu',
  imports: [RouterLink],
  templateUrl: './profile-menu.html',
  styleUrl: './profile-menu.css',
})
export class ProfileMenu {
  isOpen = signal(false);

  constructor(private authService: AuthService) {}

  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }

  get user() {
    return this.authService.user;
  }

  get isControl() {
    return this.authService.isControl;
  }

  get isAdminOrControl() {
    return this.authService.isAdminOrControl;
  }

  userInitials() {
    return this.authService.getUserInitials();
  }

  toggle(event: Event) {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  logout() {
    this.isOpen.set(false);
    this.authService.logout();
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isOpen.set(false);
  }
}
