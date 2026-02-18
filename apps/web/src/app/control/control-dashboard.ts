import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, Organisation, User, Role, ROLES } from '../services/auth.service';

@Component({
  selector: 'app-control-dashboard',
  imports: [FormsModule],
  templateUrl: './control-dashboard.html',
  styleUrl: './control-dashboard.css',
})
export class ControlDashboard implements OnInit {
  organisations = signal<Organisation[]>([]);
  users = signal<User[]>([]);
  roles: Role[] = [ROLES.CONTROL, ROLES.ADMIN, ROLES.USER];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const [orgs, users] = await Promise.all([
        this.authService.listAllOrganisations(),
        this.authService.listAllUsers(),
      ]);
      this.organisations.set(orgs);
      this.users.set(users);
    } catch {
      this.organisations.set([]);
      this.users.set([]);
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
