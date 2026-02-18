import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Role, Organisation, User } from '@teamsport/shared';

export type { Role, Organisation, User } from '@teamsport/shared';

interface AuthResponse {
  user: User;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isControl = computed(() => this.currentUser()?.role === 'CONTROL');
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  readonly isAdminOrControl = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'ADMIN' || role === 'CONTROL';
  });

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.restoreSession();
  }

  async signup(organisationName: string, email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/signup', { organisationName, email, password }),
    );
    localStorage.setItem('accessToken', res.accessToken);
    this.currentUser.set(res.user);
    this.router.navigateByUrl('/verify-email-notice');
  }

  async signupWithInvite(email: string, password: string, inviteToken: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/signup/invite', { email, password, inviteToken }),
    );
    localStorage.setItem('accessToken', res.accessToken);
    this.currentUser.set(res.user);
    this.router.navigateByUrl('/');
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/login', { email, password }),
    );
    localStorage.setItem('accessToken', res.accessToken);
    this.currentUser.set(res.user);
    this.router.navigateByUrl('/');
  }

  logout() {
    localStorage.removeItem('accessToken');
    this.currentUser.set(null);
    this.router.navigateByUrl('/');
  }

  getUserInitials(): string {
    const name = this.currentUser()?.organisationName ?? '';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  async verifyEmail(token: string): Promise<void> {
    await firstValueFrom(
      this.http.get('/api/auth/verify-email', { params: { token } }),
    );
  }

  async inviteUser(email: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    await firstValueFrom(
      this.http.post('/api/auth/invites', { email }, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  async listOrgUsers(): Promise<User[]> {
    const token = localStorage.getItem('accessToken');
    return firstValueFrom(
      this.http.get<User[]>('/api/auth/org/users', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  async listInvites(): Promise<any[]> {
    const token = localStorage.getItem('accessToken');
    return firstValueFrom(
      this.http.get<any[]>('/api/auth/invites', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  async listAllOrganisations(): Promise<Organisation[]> {
    const token = localStorage.getItem('accessToken');
    return firstValueFrom(
      this.http.get<Organisation[]>('/api/auth/organisations', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  async listAllUsers(): Promise<User[]> {
    const token = localStorage.getItem('accessToken');
    return firstValueFrom(
      this.http.get<User[]>('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  async deleteUser(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    await firstValueFrom(
      this.http.delete(`/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  async deleteOrganisation(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    await firstValueFrom(
      this.http.delete(`/api/auth/organisations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  async changeUserRole(id: string, role: Role): Promise<User> {
    const token = localStorage.getItem('accessToken');
    return firstValueFrom(
      this.http.patch<User>(`/api/auth/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  }

  private async restoreSession(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const user = await firstValueFrom(
        this.http.get<User>('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      this.currentUser.set(user);
    } catch {
      localStorage.removeItem('accessToken');
    }
  }
}
