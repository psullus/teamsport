import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, firstValueFrom, catchError } from 'rxjs';
import { ROLES, SPORT_TYPES, POSITIONS_BY_SPORT } from '@teamsport/shared';
import type {
  Role, Organisation, User, Club, Team, ClubWithTeams,
  League, LeagueDetail, Fixture, Goal, SportType, ClubMembership,
  Event,
} from '@teamsport/shared';

export { ROLES, SPORT_TYPES, POSITIONS_BY_SPORT } from '@teamsport/shared';
export type {
  Role, Organisation, User, Club, Team, ClubWithTeams,
  League, LeagueDetail, LeagueType, FixtureStatus, Fixture, Goal,
  ScorerFixture, StandingsRow, TopScorer, SportType, ClubMembership,
  Event,
} from '@teamsport/shared';

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

  async signup(
    organisationName: string,
    email: string,
    password: string,
    clubName: string,
    clubType: string,
    teamName: string,
  ): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/signup', {
        organisationName, email, password, clubName, clubType, teamName,
      }),
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

  async listClubs(): Promise<Club[]> {
    return firstValueFrom(this.http.get<Club[]>('/api/auth/clubs'));
  }

  async createClub(name: string, type: string): Promise<Club> {
    return firstValueFrom(this.http.post<Club>('/api/auth/clubs', { name, type }));
  }

  async listClubUsers(clubId: string): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(`/api/auth/clubs/${clubId}/users`));
  }

  async addUserToClub(clubId: string, userId: string): Promise<void> {
    await firstValueFrom(this.http.post(`/api/auth/clubs/${clubId}/users`, { userId }));
  }

  async removeUserFromClub(clubId: string, userId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/clubs/${clubId}/users/${userId}`));
  }

  async updateClub(clubId: string, name: string, type?: string): Promise<Club> {
    return firstValueFrom(this.http.patch<Club>(`/api/auth/clubs/${clubId}`, { name, type }));
  }

  async deleteClub(clubId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/clubs/${clubId}`));
  }

  async listTeams(clubId: string): Promise<Team[]> {
    return firstValueFrom(this.http.get<Team[]>(`/api/auth/clubs/${clubId}/teams`));
  }

  async createTeam(name: string, clubId: string): Promise<Team> {
    return firstValueFrom(this.http.post<Team>('/api/auth/teams', { name, clubId }));
  }

  async listTeamUsers(teamId: string): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(`/api/auth/teams/${teamId}/users`));
  }

  async addUserToTeam(teamId: string, userId: string): Promise<void> {
    await firstValueFrom(this.http.post(`/api/auth/teams/${teamId}/users`, { userId }));
  }

  async removeUserFromTeam(teamId: string, userId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/teams/${teamId}/users/${userId}`));
  }

  async renameTeam(teamId: string, name: string): Promise<Team> {
    return firstValueFrom(this.http.patch<Team>(`/api/auth/teams/${teamId}`, { name }));
  }

  async deleteTeam(teamId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/teams/${teamId}`));
  }

  async listMyClubs(): Promise<ClubWithTeams[]> {
    return firstValueFrom(this.http.get<ClubWithTeams[]>('/api/auth/me/clubs'));
  }

  async listMyMemberships(): Promise<ClubMembership[]> {
    return firstValueFrom(this.http.get<ClubMembership[]>('/api/auth/me/memberships'));
  }

  async updateMyPosition(clubId: string, position: string | null): Promise<void> {
    await firstValueFrom(
      this.http.patch(`/api/auth/me/memberships/${clubId}/position`, { position }),
    );
  }

  async updateProfile(formData: FormData): Promise<User> {
    const user = await firstValueFrom(
      this.http.patch<User>('/api/auth/profile', formData),
    );
    this.currentUser.set(user);
    return user;
  }

  async removeAvatar(): Promise<User> {
    const user = await firstValueFrom(
      this.http.delete<User>('/api/auth/profile/avatar'),
    );
    this.currentUser.set(user);
    return user;
  }

  async listLeagues(): Promise<League[]> {
    return firstValueFrom(this.http.get<League[]>('/api/auth/leagues'));
  }

  async getLeagueDetail(id: string): Promise<LeagueDetail> {
    return firstValueFrom(this.http.get<LeagueDetail>(`/api/auth/leagues/${id}`));
  }

  async createLeague(name: string, type: string, clubId?: string): Promise<League> {
    return firstValueFrom(
      this.http.post<League>('/api/auth/leagues', { name, type, clubId }),
    );
  }

  async deleteLeague(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/leagues/${id}`));
  }

  async addLeagueParticipant(leagueId: string, teamId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`/api/auth/leagues/${leagueId}/participants`, { teamId }),
    );
  }

  async removeLeagueParticipant(leagueId: string, teamId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`/api/auth/leagues/${leagueId}/participants/${teamId}`),
    );
  }

  async generateRoundRobin(
    leagueId: string,
    options: { days: string[]; timeSlots: string[]; force: boolean },
  ): Promise<Fixture[]> {
    return firstValueFrom(
      this.http.post<Fixture[]>(`/api/auth/leagues/${leagueId}/round-robin`, options),
    );
  }

  async createFixture(
    leagueId: string, homeId: string, awayId: string, date?: string,
  ): Promise<Fixture> {
    return firstValueFrom(
      this.http.post<Fixture>(`/api/auth/leagues/${leagueId}/fixtures`, { homeId, awayId, date }),
    );
  }

  async updateFixture(
    fixtureId: string,
    updates: { date?: string; homeScore?: number; awayScore?: number; status?: string },
  ): Promise<Fixture> {
    return firstValueFrom(
      this.http.patch<Fixture>(`/api/auth/fixtures/${fixtureId}`, updates),
    );
  }

  async deleteFixture(fixtureId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/fixtures/${fixtureId}`));
  }

  async createGoal(fixtureId: string, scorerId: string): Promise<Goal> {
    return firstValueFrom(
      this.http.post<Goal>(`/api/auth/fixtures/${fixtureId}/goals`, { scorerId }),
    );
  }

  async deleteGoal(goalId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/goals/${goalId}`));
  }

  async listEvents(): Promise<Event[]> {
    return firstValueFrom(this.http.get<Event[]>('/api/auth/events'));
  }

  async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'organisationId'>): Promise<Event> {
    return firstValueFrom(this.http.post<Event>('/api/auth/events', data));
  }

  async updateEvent(id: string, data: Partial<Omit<Event, 'id' | 'createdAt' | 'organisationId'>>): Promise<Event> {
    return firstValueFrom(this.http.patch<Event>(`/api/auth/events/${id}`, data));
  }

  async deleteEvent(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/events/${id}`));
  }

  private restoreSession(): void {
    this.http.get<User>('/api/auth/me').pipe(
      catchError(() => EMPTY),
    ).subscribe((user) => {
      this.currentUser.set(user);
    });
  }
}
