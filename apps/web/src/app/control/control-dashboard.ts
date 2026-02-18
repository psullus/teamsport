import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, Organisation, User, Role } from '../services/auth.service';

@Component({
  selector: 'app-control-dashboard',
  imports: [FormsModule],
  templateUrl: './control-dashboard.html',
  styleUrl: './control-dashboard.css',
})
export class ControlDashboard implements OnInit {
  organisations: Organisation[] = [];
  users: User[] = [];
  roles: Role[] = ['CONTROL', 'ADMIN', 'USER'];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.organisations = await this.authService.listAllOrganisations();
      this.users = await this.authService.listAllUsers();
    } catch {
      this.organisations = [];
      this.users = [];
    }
  }

  async deleteOrg(id: string) {
    await this.authService.deleteOrganisation(id);
    this.loadData();
  }

  async deleteUser(id: string) {
    await this.authService.deleteUser(id);
    this.loadData();
  }

  async onRoleChange(userId: string, newRole: Role) {
    await this.authService.changeUserRole(userId, newRole);
    this.loadData();
  }
}
