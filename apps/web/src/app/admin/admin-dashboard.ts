import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, User, Role, ROLES } from '../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  inviteEmail = signal('');
  inviteSuccess = signal('');
  inviteError = signal('');
  users = signal<User[]>([]);
  invites = signal<any[]>([]);

  roles: Role[] = [ROLES.ADMIN, ROLES.USER];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadInvites();
  }

  async loadUsers() {
    try {
      this.users.set(await this.authService.listOrgUsers());
    } catch {
      this.users.set([]);
    }
  }

  async loadInvites() {
    try {
      this.invites.set(await this.authService.listInvites());
    } catch {
      this.invites.set([]);
    }
  }

  async onRoleChange(userId: string, newRole: Role) {
    await this.authService.changeUserRole(userId, newRole);
    this.loadUsers();
  }

  async sendInvite() {
    this.inviteSuccess.set('');
    this.inviteError.set('');
    try {
      await this.authService.inviteUser(this.inviteEmail());
      this.inviteSuccess.set(`Invite sent to ${this.inviteEmail()}`);
      this.inviteEmail.set('');
      this.loadInvites();
    } catch (err: any) {
      this.inviteError.set(err?.error?.message || 'Failed to send invite.');
    }
  }
}
