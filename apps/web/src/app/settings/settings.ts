import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuthService, POSITIONS_BY_SPORT,
  type ClubMembership, type SportType,
} from '../services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  firstName = '';
  lastName = '';
  phone = '';
  avatarPreview = signal<string | null>(null);
  selectedFile: File | null = null;
  success = signal('');
  error = signal('');
  saving = signal(false);
  memberships = signal<ClubMembership[]>([]);

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.firstName = user.firstName ?? '';
      this.lastName = user.lastName ?? '';
      this.phone = user.phone ?? '';
      this.avatarPreview.set(user.avatarUrl);
    }
    this.loadMemberships();
  }

  async loadMemberships() {
    try {
      this.memberships.set(await this.authService.listMyMemberships());
    } catch {
      this.memberships.set([]);
    }
  }

  positionsForClub(clubType: SportType): string[] {
    return POSITIONS_BY_SPORT[clubType] ?? [];
  }

  async onPositionChange(clubId: string, position: string) {
    try {
      await this.authService.updateMyPosition(clubId, position || null);
    } catch {
      // silently fail
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    this.error.set('');
    this.success.set('');
    this.saving.set(true);
    try {
      const formData = new FormData();
      formData.append('firstName', this.firstName);
      formData.append('lastName', this.lastName);
      formData.append('phone', this.phone);
      if (this.selectedFile) {
        formData.append('avatar', this.selectedFile);
      }
      await this.authService.updateProfile(formData);
      this.selectedFile = null;
      this.success.set('Profile updated successfully.');
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to update profile.');
    } finally {
      this.saving.set(false);
    }
  }

  async removeAvatar() {
    this.error.set('');
    this.success.set('');
    try {
      await this.authService.removeAvatar();
      this.avatarPreview.set(null);
      this.selectedFile = null;
      this.success.set('Avatar removed.');
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to remove avatar.');
    }
  }
}
