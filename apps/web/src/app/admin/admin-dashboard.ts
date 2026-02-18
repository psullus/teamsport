import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  inviteEmail = '';
  inviteSuccess = '';
  inviteError = '';
  users: User[] = [];
  invites: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadInvites();
  }

  async loadUsers() {
    try {
      this.users = await this.authService.listOrgUsers();
    } catch {
      this.users = [];
    }
  }

  async loadInvites() {
    try {
      this.invites = await this.authService.listInvites();
    } catch {
      this.invites = [];
    }
  }

  async sendInvite() {
    this.inviteSuccess = '';
    this.inviteError = '';
    try {
      await this.authService.inviteUser(this.inviteEmail);
      this.inviteSuccess = `Invite sent to ${this.inviteEmail}`;
      this.inviteEmail = '';
      this.loadInvites();
    } catch (err: any) {
      this.inviteError = err?.error?.message || 'Failed to send invite.';
    }
  }
}
