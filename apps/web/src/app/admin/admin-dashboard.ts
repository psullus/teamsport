import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService, User, Role, ROLES, Club, Team, SPORT_TYPES,
  type League, type LeagueDetail, type Fixture, type StandingsRow, type TopScorer,
  type Event, type JoinRequest, type CarouselImage,
} from '../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  activeTab = signal<'home' | 'members' | 'clubs' | 'teams' | 'leagues' | 'events'>('members');
  memberSearch = signal('');
  memberEmail = signal('');
  memberFirstName = signal('');
  memberLastName = signal('');
  memberSex = signal('');
  memberSuccess = signal('');
  memberError = signal('');
  inviteEmail = signal('');
  inviteSuccess = signal('');
  inviteError = signal('');
  users = signal<User[]>([]);
  invites = signal<any[]>([]);

  pendingJoinRequests = signal<JoinRequest[]>([]);

  clubs = signal<Club[]>([]);
  selectedClub = signal<Club | null>(null);
  clubName = signal('');
  clubType = signal('Touch');
  clubMembers = signal<User[]>([]);
  addClubUserId = signal('');
  editingClubId = signal<string | null>(null);
  editClubName = signal('');
  editClubType = signal('Touch');
  sportTypes = SPORT_TYPES;

  teams = signal<Team[]>([]);
  selectedTeam = signal<Team | null>(null);
  teamName = signal('');
  teamMembers = signal<User[]>([]);
  addTeamUserId = signal('');
  editingTeamId = signal<string | null>(null);
  editTeamName = signal('');
  teamClubId = signal('');
  teamError = signal('');

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
  openGoals = signal<Record<string, boolean>>({});
  teamMembersCache = signal<Record<string, User[]>>({});
  showRoundRobinForm = signal(false);
  roundRobinDays = signal<string[]>(['monday']);
  roundRobinTimeSlots = signal<string[]>(['19:00']);
  roundRobinNewTime = signal('19:00');
  roundRobinConfirmRestart = signal(false);
  allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  events = signal<Event[]>([]);
  eventTitle = signal('');
  eventDate = signal('');
  eventStartTime = signal('');
  eventEndTime = signal('');
  eventAllDay = signal(false);
  eventPrimaryContact = signal('');
  eventSecondaryContact = signal('');
  eventHostedByName = signal('');
  eventLocation = signal('');
  eventDescription = signal('');
  editingEventId = signal<string | null>(null);
  editEventTitle = signal('');
  editEventDate = signal('');
  editEventStartTime = signal('');
  editEventEndTime = signal('');
  editEventAllDay = signal(false);
  editEventPrimaryContact = signal('');
  editEventSecondaryContact = signal('');
  editEventHostedByName = signal('');
  editEventLocation = signal('');
  editEventDescription = signal('');

  homeMessage = signal('');
  carouselImages = signal<CarouselImage[]>([]);
  carouselUploadError = signal('');
  homeMessageSaving = signal(false);

  roles: Role[] = [ROLES.ADMIN, ROLES.USER];

  filteredUsers(): User[] {
    const term = this.memberSearch().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
      const email = u.email?.endsWith('@noemail.local') ? '' : u.email.toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }

  displayEmail(user: User): string {
    return user.email?.endsWith('@noemail.local') ? '' : user.email;
  }

  displayName(user: User): string {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }

  displayMemberOption(user: User): string {
    const name = this.displayName(user);
    const email = this.displayEmail(user);
    if (name && email) return `${name} (${email})`;
    return name || email;
  }

  constructor(private authService: AuthService) {}

  setTab(tab: 'home' | 'members' | 'clubs' | 'teams' | 'leagues' | 'events') {
    this.activeTab.set(tab);
  }

  ngOnInit() {
    this.loadUsers();
    this.loadInvites();
    this.loadPendingJoinRequests();
    this.loadClubs().then(() => this.loadAllTeams());
    this.loadLeagues();
    this.loadEvents();
    this.loadHomeContent();
  }

  editingUserId = signal<string | null>(null);
  editUserFirstName = signal('');
  editUserLastName = signal('');
  editUserEmail = signal('');
  editUserSex = signal('');
  confirmDeleteUserId = signal<string | null>(null);
  memberInviteSuccess = signal<Record<string, string>>({});
  memberInviteError = signal<Record<string, string>>({});
  confirmDeleteClubId = signal<string | null>(null);
  confirmDeleteTeamId = signal<string | null>(null);
  confirmDeleteLeagueId = signal<string | null>(null);

  async loadHomeContent() {
    try {
      const content = await this.authService.getHomeContent();
      this.homeMessage.set(content.message ?? '');
      this.carouselImages.set(content.images);
    } catch {
      this.homeMessage.set('');
      this.carouselImages.set([]);
    }
  }

  async saveHomeMessage() {
    this.homeMessageSaving.set(true);
    try {
      const msg = this.homeMessage() || null;
      await this.authService.updateHomeMessage(msg);
    } finally {
      this.homeMessageSaving.set(false);
    }
  }

  async uploadCarouselImage(event: globalThis.Event) {
    this.carouselUploadError.set('');
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const image = await this.authService.uploadCarouselImage(formData);
      this.carouselImages.update((imgs) => [...imgs, image]);
    } catch (err: any) {
      this.carouselUploadError.set(err?.error?.message || 'Failed to upload image.');
    }
    input.value = '';
  }

  async deleteCarouselImage(id: string) {
    await this.authService.deleteCarouselImage(id);
    this.carouselImages.update((imgs) => imgs.filter((i) => i.id !== id));
  }

  startEditUser(user: User) {
    this.editingUserId.set(user.id);
    this.editUserFirstName.set(user.firstName ?? '');
    this.editUserLastName.set(user.lastName ?? '');
    this.editUserEmail.set(this.displayEmail(user));
    this.editUserSex.set(user.sex ?? '');
  }

  cancelEditUser() {
    this.editingUserId.set(null);
  }

  async saveUser() {
    const id = this.editingUserId();
    if (!id) return;
    try {
      await this.authService.updateOrgUser(id, {
        firstName: this.editUserFirstName(),
        lastName: this.editUserLastName(),
        email: this.editUserEmail() || undefined,
        sex: this.editUserSex(),
      });
      this.editingUserId.set(null);
      this.loadUsers();
    } catch (err: any) {
      this.memberError.set(err?.error?.message || 'Failed to update member.');
    }
  }

  async sendMemberInvite(user: User) {
    const email = this.displayEmail(user);
    if (!email) return;
    this.memberInviteSuccess.update((m) => ({ ...m, [user.id]: '' }));
    this.memberInviteError.update((m) => ({ ...m, [user.id]: '' }));
    try {
      const resetLink = await this.authService.forgotPassword(email);
      const msg = resetLink
        ? `Invite sent. Link: ${resetLink}`
        : `Invite sent to ${email}.`;
      this.memberInviteSuccess.update((m) => ({ ...m, [user.id]: msg }));
    } catch (err: any) {
      this.memberInviteError.update((m) => ({
        ...m,
        [user.id]: err?.error?.message || 'Failed to send invite.',
      }));
    }
  }

  async deleteOrgUser(userId: string) {
    this.confirmDeleteUserId.set(null);
    await this.authService.deleteOrgUser(userId);
    this.loadUsers();
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

  async deleteInvite(inviteId: string) {
    await this.authService.deleteInvite(inviteId);
    this.loadInvites();
  }

  async createMember() {
    this.memberSuccess.set('');
    this.memberError.set('');
    try {
      const email = this.memberEmail() || undefined;
      const firstName = this.memberFirstName() || undefined;
      const lastName = this.memberLastName() || undefined;
      const sex = this.memberSex() || undefined;
      if (!email && !firstName && !lastName) return;
      await this.authService.createMember({ email, firstName, lastName, sex });
      const label = email || [firstName, lastName].filter(Boolean).join(' ');
      this.memberSuccess.set(`Member ${label} added successfully.`);
      this.memberEmail.set('');
      this.memberFirstName.set('');
      this.memberLastName.set('');
      this.memberSex.set('');
      this.loadUsers();
    } catch (err: any) {
      this.memberError.set(err?.error?.message || 'Failed to add member.');
    }
  }

  async sendInvite() {
    this.inviteSuccess.set('');
    this.inviteError.set('');
    try {
      const email = this.inviteEmail();
      const { token } = await this.authService.inviteUser(email);
      const inviteLink = `${window.location.origin}/invite?token=${token}`;
      this.inviteSuccess.set(`Invite sent to ${email}. Link: ${inviteLink}`);
      this.inviteEmail.set('');
      this.loadInvites();
    } catch (err: any) {
      this.inviteError.set(err?.error?.message || 'Failed to send invite.');
    }
  }

  async loadPendingJoinRequests() {
    try {
      this.pendingJoinRequests.set(await this.authService.listPendingJoinRequests());
    } catch {
      this.pendingJoinRequests.set([]);
    }
  }

  async approveJoinRequest(id: string) {
    await this.authService.respondToJoinRequest(id, 'approved');
    this.loadPendingJoinRequests();
  }

  async rejectJoinRequest(id: string) {
    await this.authService.respondToJoinRequest(id, 'rejected');
    this.loadPendingJoinRequests();
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
    const type = this.clubType();
    if (!name) return;
    await this.authService.createClub(name, type);
    this.clubName.set('');
    this.clubType.set('Touch');
    this.loadClubs();
  }

  startEditClub(club: Club) {
    this.editingClubId.set(club.id);
    this.editClubName.set(club.name);
    this.editClubType.set(club.type);
  }

  cancelEditClub() {
    this.editingClubId.set(null);
    this.editClubName.set('');
    this.editClubType.set('Touch');
  }

  async saveClub() {
    const id = this.editingClubId();
    const name = this.editClubName();
    const type = this.editClubType();
    if (!id || !name) return;
    await this.authService.updateClub(id, name, type);
    this.editingClubId.set(null);
    this.editClubName.set('');
    this.editClubType.set('Touch');
    this.loadClubs();
    const selected = this.selectedClub();
    if (selected?.id === id) {
      this.selectedClub.set({ ...selected, name, type: type as any });
    }
  }

  async deleteClub(clubId: string) {
    this.confirmDeleteClubId.set(null);
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
    this.loadAllTeams();
  }

  async createTeamFromTab() {
    const clubId = this.teamClubId();
    const name = this.teamName();
    this.teamError.set('');
    if (!clubId || !name) return;
    try {
      await this.authService.createTeam(name, clubId);
      this.teamName.set('');
      this.teamClubId.set('');
      this.loadAllTeams();
    } catch (err: any) {
      this.teamError.set(err?.error?.message || 'Failed to create team.');
    }
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
    this.loadAllTeams();
    const selected = this.selectedTeam();
    if (selected?.id === id) {
      this.selectedTeam.set({ ...selected, name });
    }
  }

  async deleteTeam(teamId: string) {
    this.confirmDeleteTeamId.set(null);
    await this.authService.deleteTeam(teamId);
    if (this.selectedTeam()?.id === teamId) {
      this.selectedTeam.set(null);
      this.teamMembers.set([]);
    }
    const club = this.selectedClub();
    if (club) this.loadTeams(club.id);
    this.loadAllTeams();
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
      this.leagues.set(await this.authService.listLeagues(true));
    } catch {
      this.leagues.set([]);
    }
  }

  async archiveLeague(leagueId: string, archived: boolean) {
    await this.authService.archiveLeague(leagueId, archived);
    this.loadLeagues();
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
      const detail = await this.authService.getLeagueDetail(leagueId);
      this.leagueDetail.set(detail);
      await this.loadParticipantMembers(detail.participants);
    } catch {
      this.leagueDetail.set(null);
    }
  }

  private async loadParticipantMembers(participants: Team[]) {
    const cache: Record<string, User[]> = {};
    for (const team of participants) {
      try {
        cache[team.id] = await this.authService.listTeamUsers(team.id);
      } catch {
        cache[team.id] = [];
      }
    }
    this.teamMembersCache.set(cache);
  }

  fixturePlayers(fixture: Fixture): User[] {
    const cache = this.teamMembersCache();
    const home = cache[fixture.homeId] ?? [];
    const away = cache[fixture.awayId] ?? [];
    const seen = new Set<string>();
    const result: User[] = [];
    for (const u of [...home, ...away]) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        result.push(u);
      }
    }
    return result;
  }

  async deleteLeague(leagueId: string) {
    this.confirmDeleteLeagueId.set(null);
    await this.authService.deleteLeague(leagueId);
    this.selectedLeague.set(null);
    this.leagueDetail.set(null);
    this.loadLeagues();
  }

  toggleRoundRobinForm() {
    this.showRoundRobinForm.update((v) => !v);
    this.roundRobinConfirmRestart.set(false);
  }

  toggleDay(day: string) {
    this.roundRobinDays.update((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    );
  }

  addTimeSlot() {
    const time = this.roundRobinNewTime();
    if (!time) return;
    const current = this.roundRobinTimeSlots();
    if (current.includes(time)) return;
    this.roundRobinTimeSlots.set([...current, time]);
    this.roundRobinNewTime.set('19:00');
  }

  removeTimeSlot(index: number) {
    this.roundRobinTimeSlots.update((slots) => slots.filter((_, i) => i !== index));
  }

  async generateRoundRobin() {
    const league = this.selectedLeague();
    if (!league) return;
    const detail = this.leagueDetail();
    const isStarted = detail?.league.started ?? false;
    await this.authService.generateRoundRobin(league.id, {
      days: this.roundRobinDays(),
      timeSlots: this.roundRobinTimeSlots(),
      force: isStarted,
    });
    this.showRoundRobinForm.set(false);
    this.roundRobinConfirmRestart.set(false);
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

  toggleGoals(fixtureId: string) {
    this.openGoals.update((m) => ({ ...m, [fixtureId]: !m[fixtureId] }));
  }

  isGoalsOpen(fixtureId: string): boolean {
    return this.openGoals()[fixtureId] ?? false;
  }

  goalCount(fixtureId: string): number {
    return this.groupedGoals(fixtureId).reduce((sum, e) => sum + e.count, 0);
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

  async loadEvents() {
    try {
      this.events.set(await this.authService.listEvents());
    } catch {
      this.events.set([]);
    }
  }

  async createEvent() {
    const title = this.eventTitle();
    const date = this.eventDate();
    const hostedByName = this.eventHostedByName();
    if (!title || !date || !hostedByName) return;
    await this.authService.createEvent({
      title,
      date,
      startTime: this.eventStartTime() || null,
      endTime: this.eventEndTime() || null,
      allDay: this.eventAllDay(),
      primaryContact: this.eventPrimaryContact() || null,
      secondaryContact: this.eventSecondaryContact() || null,
      hostedByName,
      location: this.eventLocation() || null,
      description: this.eventDescription() || null,
    });
    this.eventTitle.set('');
    this.eventDate.set('');
    this.eventStartTime.set('');
    this.eventEndTime.set('');
    this.eventAllDay.set(false);
    this.eventPrimaryContact.set('');
    this.eventSecondaryContact.set('');
    this.eventHostedByName.set('');
    this.eventLocation.set('');
    this.eventDescription.set('');
    this.loadEvents();
  }

  startEditEvent(event: Event) {
    this.editingEventId.set(event.id);
    this.editEventTitle.set(event.title);
    this.editEventDate.set(event.date);
    this.editEventStartTime.set(event.startTime ?? '');
    this.editEventEndTime.set(event.endTime ?? '');
    this.editEventAllDay.set(event.allDay);
    this.editEventPrimaryContact.set(event.primaryContact ?? '');
    this.editEventSecondaryContact.set(event.secondaryContact ?? '');
    this.editEventHostedByName.set(event.hostedByName);
    this.editEventLocation.set(event.location ?? '');
    this.editEventDescription.set(event.description ?? '');
  }

  cancelEditEvent() {
    this.editingEventId.set(null);
  }

  async saveEvent() {
    const id = this.editingEventId();
    if (!id) return;
    await this.authService.updateEvent(id, {
      title: this.editEventTitle(),
      date: this.editEventDate(),
      startTime: this.editEventStartTime() || null,
      endTime: this.editEventEndTime() || null,
      allDay: this.editEventAllDay(),
      primaryContact: this.editEventPrimaryContact() || null,
      secondaryContact: this.editEventSecondaryContact() || null,
      hostedByName: this.editEventHostedByName(),
      location: this.editEventLocation() || null,
      description: this.editEventDescription() || null,
    });
    this.editingEventId.set(null);
    this.loadEvents();
  }

  async deleteEvent(eventId: string) {
    await this.authService.deleteEvent(eventId);
    this.loadEvents();
  }
}
