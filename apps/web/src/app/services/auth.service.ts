import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, firstValueFrom, catchError } from 'rxjs';
import { ROLES } from '@teamsport/shared';
import type { Role, Organisation, User } from '@teamsport/shared';

export { ROLES } from '@teamsport/shared';
export type { Role, Organisation, User } from '@teamsport/shared';

interface AuthResponse {
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isControl = computed(() => this.currentUser()?.role === ROLES.CONTROL);
  readonly isAdmin = computed(() => this.currentUser()?.role === ROLES.ADMIN);
  readonly isAdminOrControl = computed(() => {
    const role = this.currentUser()?.role;
    return role === ROLES.ADMIN || role === ROLES.CONTROL;
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
    this.currentUser.set(res.user);
    await this.router.navigateByUrl('/verify-email-notice');
  }

  async signupWithInvite(email: string, password: string, inviteToken: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/signup/invite', { email, password, inviteToken }),
    );
    this.currentUser.set(res.user);
    await this.router.navigateByUrl('/');
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/login', { email, password }),
    );
    this.currentUser.set(res.user);
    await this.router.navigateByUrl('/');
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/logout', {}));
    } catch {
      // Server might not have this endpoint yet
    } finally {
      this.currentUser.set(null);
      await this.router.navigateByUrl('/');
    }
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
    await firstValueFrom(
      this.http.post('/api/auth/invites', { email }),
    );
  }

  async listOrgUsers(): Promise<User[]> {
    return firstValueFrom(
      this.http.get<User[]>('/api/auth/org/users'),
    );
  }

  async listInvites(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>('/api/auth/invites'),
    );
  }

  async listAllOrganisations(): Promise<Organisation[]> {
    return firstValueFrom(
      this.http.get<Organisation[]>('/api/auth/organisations'),
    );
  }

  async listAllUsers(): Promise<User[]> {
    return firstValueFrom(
      this.http.get<User[]>('/api/auth/users'),
    );
  }

  async deleteUser(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`/api/auth/users/${id}`),
    );
  }

  async deleteOrganisation(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`/api/auth/organisations/${id}`),
    );
  }

  async changeUserRole(id: string, role: Role): Promise<User> {
    return firstValueFrom(
      this.http.patch<User>(`/api/auth/users/${id}/role`, { role }),
    );
  }

  private restoreSession(): void {
    this.http.get<User>('/api/auth/me').pipe(
      catchError(() => EMPTY),
    ).subscribe((user) => {
      this.currentUser.set(user);
    });
  }
}
