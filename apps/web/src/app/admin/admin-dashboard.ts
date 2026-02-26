import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService, User, Role, ROLES, Club, Team,
  type League, type LeagueDetail, type Fixture, type StandingsRow, type TopScorer,
} from '../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  activeTab = signal<'members' | 'clubs' | 'leagues'>('members');
  inviteEmail = signal('');
  inviteSuccess = signal('');
  inviteError = signal('');
  users = signal<User[]>([]);
  invites = signal<any[]>([]);

  clubs = signal<Club[]>([]);
  selectedClub = signal<Club | null>(null);
  clubName = signal('');
  clubMembers = signal<User[]>([]);
  addClubUserId = signal('');
  editingClubId = signal<string | null>(null);
  editClubName = signal('');

  teams = signal<Team[]>([]);
  selectedTeam = signal<Team | null>(null);
  teamName = signal('');
  teamMembers = signal<User[]>([]);
  addTeamUserId = signal('');
  editingTeamId = signal<string | null>(null);
  editTeamName = signal('');

  leagues = signal<League[]>([]);
  selectedLeague = signal<League | null>(null);
  leagueDetail = signal<LeagueDetail | null>(null);
  leagueTab = signal<'teams' | 'fixtures' | 'standings' | 'scorers'>('teams');
  addParticipantTeamId = signal('');
  allTeams = signal<Team[]>([]);
  leagueName = signal('');
  leagueType = signal<'club' | 'team'>('club');
  leagueClubId = signal('');
  fixtureHomeId = signal('');
  fixtureAwayId = signal('');
  fixtureDate = signal('');
  goalScorerIds = signal<Record<string, string>>({});

  roles: Role[] = [ROLES.ADMIN, ROLES.USER];

  constructor(private authService: AuthService) {}

  setTab(tab: 'members' | 'clubs' | 'leagues') {
    this.activeTab.set(tab);
  }

  ngOnInit() {
    this.loadUsers();
    this.loadInvites();
    this.loadClubs().then(() => this.loadAllTeams());
    this.loadLeagues();
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

  async loadClubs() {
    try {
      this.clubs.set(await this.authService.listClubs());
    } catch {
      this.clubs.set([]);
    }
  }

  async createClub() {
    const name = this.clubName();
    if (!name) return;
    await this.authService.createClub(name);
    this.clubName.set('');
    this.loadClubs();
  }

  startEditClub(club: Club) {
    this.editingClubId.set(club.id);
    this.editClubName.set(club.name);
  }

  cancelEditClub() {
    this.editingClubId.set(null);
    this.editClubName.set('');
  }

  async saveClubName() {
    const id = this.editingClubId();
    const name = this.editClubName();
    if (!id || !name) return;
    await this.authService.renameClub(id, name);
    this.editingClubId.set(null);
    this.editClubName.set('');
    this.loadClubs();
    const selected = this.selectedClub();
    if (selected?.id === id) {
      this.selectedClub.set({ ...selected, name });
    }
  }

  async deleteClub(clubId: string) {
    await this.authService.deleteClub(clubId);
    if (this.selectedClub()?.id === clubId) {
      this.selectedClub.set(null);
      this.teams.set([]);
      this.clubMembers.set([]);
      this.selectedTeam.set(null);
      this.teamMembers.set([]);
    }
    this.loadClubs();
  }

  async selectClub(club: Club) {
    this.selectedClub.set(club);
    this.selectedTeam.set(null);
    this.teamMembers.set([]);
    this.loadClubMembers(club.id);
    this.loadTeams(club.id);
  }

  async loadClubMembers(clubId: string) {
    try {
      this.clubMembers.set(await this.authService.listClubUsers(clubId));
    } catch {
      this.clubMembers.set([]);
    }
  }

  async addUserToClub() {
    const club = this.selectedClub();
    const userId = this.addClubUserId();
    if (!club || !userId) return;
    await this.authService.addUserToClub(club.id, userId);
    this.addClubUserId.set('');
    this.loadClubMembers(club.id);
  }

  async removeUserFromClub(userId: string) {
    const club = this.selectedClub();
    if (!club) return;
    await this.authService.removeUserFromClub(club.id, userId);
    this.loadClubMembers(club.id);
  }

  async loadTeams(clubId: string) {
    try {
      this.teams.set(await this.authService.listTeams(clubId));
    } catch {
      this.teams.set([]);
    }
  }

  async createTeam() {
    const club = this.selectedClub();
    const name = this.teamName();
    if (!club || !name) return;
    await this.authService.createTeam(name, club.id);
    this.teamName.set('');
    this.loadTeams(club.id);
  }

  startEditTeam(team: Team) {
    this.editingTeamId.set(team.id);
    this.editTeamName.set(team.name);
  }

  cancelEditTeam() {
    this.editingTeamId.set(null);
    this.editTeamName.set('');
  }

  async saveTeamName() {
    const id = this.editingTeamId();
    const name = this.editTeamName();
    if (!id || !name) return;
    await this.authService.renameTeam(id, name);
    this.editingTeamId.set(null);
    this.editTeamName.set('');
    const club = this.selectedClub();
    if (club) this.loadTeams(club.id);
    const selected = this.selectedTeam();
    if (selected?.id === id) {
      this.selectedTeam.set({ ...selected, name });
    }
  }

  async deleteTeam(teamId: string) {
    await this.authService.deleteTeam(teamId);
    if (this.selectedTeam()?.id === teamId) {
      this.selectedTeam.set(null);
      this.teamMembers.set([]);
    }
    const club = this.selectedClub();
    if (club) this.loadTeams(club.id);
  }

  async selectTeam(team: Team) {
    this.selectedTeam.set(team);
    this.loadTeamMembers(team.id);
  }

  async loadTeamMembers(teamId: string) {
    try {
      this.teamMembers.set(await this.authService.listTeamUsers(teamId));
    } catch {
      this.teamMembers.set([]);
    }
  }

  async addUserToTeam() {
    const team = this.selectedTeam();
    const userId = this.addTeamUserId();
    if (!team || !userId) return;
    await this.authService.addUserToTeam(team.id, userId);
    this.addTeamUserId.set('');
    this.loadTeamMembers(team.id);
  }

  async removeUserFromTeam(userId: string) {
    const team = this.selectedTeam();
    if (!team) return;
    await this.authService.removeUserFromTeam(team.id, userId);
    this.loadTeamMembers(team.id);
  }

  async loadLeagues() {
    try {
      this.leagues.set(await this.authService.listLeagues());
    } catch {
      this.leagues.set([]);
    }
  }

  async createLeague() {
    const name = this.leagueName();
    if (!name) return;
    await this.authService.createLeague(name, 'club');
    this.leagueName.set('');
    this.loadLeagues();
  }

  async selectLeague(league: League) {
    this.selectedLeague.set(league);
    this.loadLeagueDetail(league.id);
  }

  async loadAllTeams() {
    const teams: Team[] = [];
    for (const club of this.clubs()) {
      try {
        const clubTeams = await this.authService.listTeams(club.id);
        teams.push(...clubTeams);
      } catch {
        // skip
      }
    }
    this.allTeams.set(teams);
  }

  clubNameForTeam(clubId: string): string {
    return this.clubs().find((c) => c.id === clubId)?.name ?? '';
  }

  async addParticipant() {
    const league = this.selectedLeague();
    const teamId = this.addParticipantTeamId();
    if (!league || !teamId) return;
    await this.authService.addLeagueParticipant(league.id, teamId);
    this.addParticipantTeamId.set('');
    this.loadLeagueDetail(league.id);
  }

  async removeParticipant(teamId: string) {
    const league = this.selectedLeague();
    if (!league) return;
    await this.authService.removeLeagueParticipant(league.id, teamId);
    this.loadLeagueDetail(league.id);
  }

  async loadLeagueDetail(leagueId: string) {
    try {
      this.leagueDetail.set(await this.authService.getLeagueDetail(leagueId));
    } catch {
      this.leagueDetail.set(null);
    }
  }

  async deleteLeague(leagueId: string) {
    await this.authService.deleteLeague(leagueId);
    this.selectedLeague.set(null);
    this.leagueDetail.set(null);
    this.loadLeagues();
  }

  async generateRoundRobin() {
    const league = this.selectedLeague();
    if (!league) return;
    await this.authService.generateRoundRobin(league.id);
    this.loadLeagueDetail(league.id);
  }

  async createFixture() {
    const league = this.selectedLeague();
    const homeId = this.fixtureHomeId();
    const awayId = this.fixtureAwayId();
    if (!league || !homeId || !awayId) return;
    const date = this.fixtureDate() || undefined;
    await this.authService.createFixture(league.id, homeId, awayId, date);
    this.fixtureHomeId.set('');
    this.fixtureAwayId.set('');
    this.fixtureDate.set('');
    this.loadLeagueDetail(league.id);
  }

  toLocalDatetime(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async updateFixtureDate(fixtureId: string, value: string) {
    if (!value) return;
    await this.authService.updateFixture(fixtureId, { date: new Date(value).toISOString() });
    const league = this.selectedLeague();
    if (league) this.loadLeagueDetail(league.id);
  }

  async updateFixtureStatus(fixtureId: string, status: string) {
    await this.authService.updateFixture(fixtureId, { status });
    const league = this.selectedLeague();
    if (league) this.loadLeagueDetail(league.id);
  }

  async updateFixtureScore(fixtureId: string, homeScore: number, awayScore: number) {
    await this.authService.updateFixture(fixtureId, { homeScore, awayScore });
    const league = this.selectedLeague();
    if (league) this.loadLeagueDetail(league.id);
  }

  async deleteFixture(fixtureId: string) {
    await this.authService.deleteFixture(fixtureId);
    const league = this.selectedLeague();
    if (league) this.loadLeagueDetail(league.id);
  }

  getGoalScorerId(fixtureId: string): string {
    return this.goalScorerIds()[fixtureId] ?? '';
  }

  setGoalScorerId(fixtureId: string, userId: string) {
    this.goalScorerIds.update((m) => ({ ...m, [fixtureId]: userId }));
  }

  async createGoal(fixtureId: string) {
    const scorerId = this.goalScorerIds()[fixtureId];
    if (!scorerId) return;
    await this.authService.createGoal(fixtureId, scorerId);
    this.goalScorerIds.update((m) => ({ ...m, [fixtureId]: '' }));
    const league = this.selectedLeague();
    if (league) this.loadLeagueDetail(league.id);
  }

  groupedGoals(fixtureId: string): { scorerId: string; scorerName: string; count: number; goalIds: string[] }[] {
    const goals = this.leagueDetail()?.goals[fixtureId] ?? [];
    const map = new Map<string, { scorerId: string; scorerName: string; count: number; goalIds: string[] }>();
    for (const g of goals) {
      if (!map.has(g.scorerId)) {
        map.set(g.scorerId, { scorerId: g.scorerId, scorerName: g.scorerName, count: 0, goalIds: [] });
      }
      const entry = map.get(g.scorerId)!;
      entry.count++;
      entry.goalIds.push(g.id);
    }
    return Array.from(map.values());
  }

  async addGoalForScorer(fixtureId: string, scorerId: string) {
    await this.authService.createGoal(fixtureId, scorerId);
    const league = this.selectedLeague();
    if (league) this.loadLeagueDetail(league.id);
  }

  async deleteGoal(goalId: string) {
    await this.authService.deleteGoal(goalId);
    const league = this.selectedLeague();
    if (league) this.loadLeagueDetail(league.id);
  }
}
