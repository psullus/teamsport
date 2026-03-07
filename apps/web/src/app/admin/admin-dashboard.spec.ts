import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { AdminDashboard } from './admin-dashboard';

describe('AdminDashboard', () => {
  let authService: {
    listOrgUsers: ReturnType<typeof vi.fn>;
    listInvites: ReturnType<typeof vi.fn>;
    inviteUser: ReturnType<typeof vi.fn>;
    listClubs: ReturnType<typeof vi.fn>;
    createClub: ReturnType<typeof vi.fn>;
    listClubUsers: ReturnType<typeof vi.fn>;
    addUserToClub: ReturnType<typeof vi.fn>;
    removeUserFromClub: ReturnType<typeof vi.fn>;
    updateClub: ReturnType<typeof vi.fn>;
    deleteClub: ReturnType<typeof vi.fn>;
    listTeams: ReturnType<typeof vi.fn>;
    createTeam: ReturnType<typeof vi.fn>;
    listTeamUsers: ReturnType<typeof vi.fn>;
    addUserToTeam: ReturnType<typeof vi.fn>;
    removeUserFromTeam: ReturnType<typeof vi.fn>;
    renameTeam: ReturnType<typeof vi.fn>;
    deleteTeam: ReturnType<typeof vi.fn>;
    changeUserRole: ReturnType<typeof vi.fn>;
    listLeagues: ReturnType<typeof vi.fn>;
    createLeague: ReturnType<typeof vi.fn>;
    getLeagueDetail: ReturnType<typeof vi.fn>;
    deleteLeague: ReturnType<typeof vi.fn>;
    archiveLeague: ReturnType<typeof vi.fn>;
    generateRoundRobin: ReturnType<typeof vi.fn>;
    createFixture: ReturnType<typeof vi.fn>;
    updateFixture: ReturnType<typeof vi.fn>;
    deleteFixture: ReturnType<typeof vi.fn>;
    createGoal: ReturnType<typeof vi.fn>;
    deleteGoal: ReturnType<typeof vi.fn>;
    listEvents: ReturnType<typeof vi.fn>;
    createEvent: ReturnType<typeof vi.fn>;
    updateEvent: ReturnType<typeof vi.fn>;
    deleteEvent: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      listOrgUsers: vi.fn().mockResolvedValue([
        { id: '1', email: 'admin@test.com', role: 'ADMIN', emailVerified: true },
        { id: '2', email: 'user@test.com', role: 'USER', emailVerified: false },
      ]),
      listInvites: vi.fn().mockResolvedValue([
        { id: 'inv-1', email: 'pending@test.com' },
      ]),
      inviteUser: vi.fn().mockResolvedValue(undefined),
      listClubs: vi.fn().mockResolvedValue([
        { id: 'club-1', name: 'Club A', type: 'Touch' as const, organisationId: 'org-1' },
      ]),
      createClub: vi.fn().mockResolvedValue({ id: 'club-2', name: 'Club B' }),
      listClubUsers: vi.fn().mockResolvedValue([
        { id: '1', email: 'admin@test.com', role: 'ADMIN' },
      ]),
      addUserToClub: vi.fn().mockResolvedValue(undefined),
      removeUserFromClub: vi.fn().mockResolvedValue(undefined),
      updateClub: vi.fn().mockResolvedValue({ id: 'club-1', name: 'Renamed Club', type: 'Touch' }),
      deleteClub: vi.fn().mockResolvedValue(undefined),
      listTeams: vi.fn().mockResolvedValue([
        { id: 'team-1', name: 'Team A', clubId: 'club-1' },
      ]),
      createTeam: vi.fn().mockResolvedValue({ id: 'team-2', name: 'Team B' }),
      listTeamUsers: vi.fn().mockResolvedValue([
        { id: '1', email: 'admin@test.com', role: 'ADMIN' },
      ]),
      addUserToTeam: vi.fn().mockResolvedValue(undefined),
      removeUserFromTeam: vi.fn().mockResolvedValue(undefined),
      renameTeam: vi.fn().mockResolvedValue({ id: 'team-1', name: 'Renamed Team' }),
      deleteTeam: vi.fn().mockResolvedValue(undefined),
      changeUserRole: vi.fn().mockResolvedValue({ id: '1', role: 'USER' }),
      listLeagues: vi.fn().mockResolvedValue([
        { id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null, started: false, archived: false },
      ]),
      archiveLeague: vi.fn().mockResolvedValue({ id: 'league-1', archived: true }),
      createLeague: vi.fn().mockResolvedValue({ id: 'league-2', name: 'Autumn League' }),
      getLeagueDetail: vi.fn().mockResolvedValue({
        league: { id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null, started: false, archived: false },
        fixtures: [
          {
            id: 'fix-1', leagueId: 'league-1', homeId: 'club-1', awayId: 'club-2',
            homeName: 'Club A', awayName: 'Club B', date: null,
            homeScore: 2, awayScore: 1, status: 'completed',
          },
        ],
        standings: [
          {
            participantId: 'club-1', participantName: 'Club A',
            played: 1, won: 1, drawn: 0, lost: 0, noShows: 0,
            goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3,
          },
        ],
        goals: {
          'fix-1': [{ id: 'goal-1', fixtureId: 'fix-1', scorerId: 'u1', scorerName: 'John Doe' }],
        },
        topScorers: [{
          userId: 'u1', name: 'John Doe', goals: 2,
          fixtures: [{ fixtureId: 'fix-1', matchLabel: 'Club A v Club B', goals: 2 }],
        }],
      }),
      deleteLeague: vi.fn().mockResolvedValue(undefined),
      generateRoundRobin: vi.fn().mockResolvedValue([]),
      createFixture: vi.fn().mockResolvedValue({ id: 'fix-2' }),
      updateFixture: vi.fn().mockResolvedValue({ id: 'fix-1', status: 'completed' }),
      deleteFixture: vi.fn().mockResolvedValue(undefined),
      createGoal: vi.fn().mockResolvedValue({ id: 'goal-1' }),
      deleteGoal: vi.fn().mockResolvedValue(undefined),
      listEvents: vi.fn().mockResolvedValue([{
        id: 'event-1', title: 'Training', date: '2026-03-10',
        startTime: '18:00', endTime: '19:30', allDay: false,
        primaryContact: null, secondaryContact: null, hostedByName: 'My Club',
        location: 'Main Pitch', description: null, organisationId: 'org-1',
        createdAt: '2026-03-01T00:00:00.000Z',
      }]),
      createEvent: vi.fn().mockResolvedValue({ id: 'event-2', title: 'Match' }),
      updateEvent: vi.fn().mockResolvedValue({ id: 'event-1', title: 'Updated Training' }),
      deleteEvent: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the heading', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Account settings');
  });

  it('should load and display org users', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const rows = el.querySelectorAll('.data-table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('admin@test.com');
    expect(rows[0].textContent).toContain('ADMIN');
    expect(rows[1].textContent).toContain('user@test.com');
  });

  it('should load and display pending invites', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const sections = el.querySelectorAll('.dashboard-section');
    const inviteSection = Array.from(sections).find(
      (s) => s.querySelector('h2')?.textContent?.includes('Pending invites'),
    )!;
    const items = inviteSection.querySelectorAll('.invite-list li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('pending@test.com');
  });

  it('should send invite and show success message', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.inviteEmail.set('new@test.com');
    await component.sendInvite();
    fixture.detectChanges();
    expect(authService.inviteUser).toHaveBeenCalledWith('new@test.com');
    expect(component.inviteSuccess()).toContain('new@test.com');
    expect(component.inviteEmail()).toBe('');
  });

  it('should show error on invite failure', async () => {
    authService.inviteUser.mockRejectedValue({ error: { message: 'Something went wrong' } });
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.inviteEmail.set('fail@test.com');
    await component.sendInvite();
    expect(component.inviteError()).toBe('Something went wrong');
  });

  it('should load clubs on init', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authService.listClubs).toHaveBeenCalled();
    expect(fixture.componentInstance.clubs()).toHaveLength(1);
  });

  it('should create a club', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.clubName.set('New Club');
    await component.createClub();
    expect(authService.createClub).toHaveBeenCalledWith('New Club', 'Touch');
    expect(component.clubName()).toBe('');
  });

  it('should select a club and load members and teams', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.selectClub({ id: 'club-1', name: 'Club A', type: 'Touch' as const, organisationId: 'org-1' });
    expect(component.selectedClub()?.id).toBe('club-1');
    expect(authService.listClubUsers).toHaveBeenCalledWith('club-1');
    expect(authService.listTeams).toHaveBeenCalledWith('club-1');
  });

  it('should render tabs and default to members', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const tabs = el.querySelectorAll('.sidebar-btn');
    expect(tabs.length).toBe(5);
    expect(tabs[0].textContent).toContain('Members');
    expect(tabs[1].textContent).toContain('Clubs');
    expect(tabs[2].textContent).toContain('Teams');
    expect(tabs[3].textContent).toContain('Leagues');
    expect(tabs[4].textContent).toContain('Events');
    expect(tabs[0].classList.contains('sidebar-btn--active')).toBe(true);
    expect(el.querySelector('h2')?.textContent).toContain('Invite a member');
  });

  it('should switch to Clubs tab when clicked', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const clubsTab = el.querySelectorAll('.sidebar-btn')[1] as HTMLButtonElement;
    clubsTab.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('clubs');
    expect(clubsTab.classList.contains('sidebar-btn--active')).toBe(true);
    expect(el.querySelector('h2')?.textContent).toContain('Clubs');
  });

  it('should rename a club', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.selectedClub.set({ id: 'club-1', name: 'Club A', type: 'Touch' as const, organisationId: 'org-1' });
    component.editingClubId.set('club-1');
    component.editClubName.set('Renamed Club');
    await component.saveClub();
    expect(authService.updateClub).toHaveBeenCalledWith('club-1', 'Renamed Club', 'Touch');
    expect(component.editingClubId()).toBeNull();
  });

  it('should delete a club', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.selectedClub.set({ id: 'club-1', name: 'Club A', type: 'Touch' as const, organisationId: 'org-1' });
    await component.deleteClub('club-1');
    expect(authService.deleteClub).toHaveBeenCalledWith('club-1');
    expect(component.selectedClub()).toBeNull();
  });

  it('should rename a team', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.selectedClub.set({ id: 'club-1', name: 'Club A', type: 'Touch' as const, organisationId: 'org-1' });
    component.selectedTeam.set({ id: 'team-1', name: 'Team A', clubId: 'club-1' });
    component.editingTeamId.set('team-1');
    component.editTeamName.set('Renamed Team');
    await component.saveTeamName();
    expect(authService.renameTeam).toHaveBeenCalledWith('team-1', 'Renamed Team');
    expect(component.editingTeamId()).toBeNull();
  });

  it('should delete a team', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.selectedClub.set({ id: 'club-1', name: 'Club A', type: 'Touch' as const, organisationId: 'org-1' });
    component.selectedTeam.set({ id: 'team-1', name: 'Team A', clubId: 'club-1' });
    await component.deleteTeam('team-1');
    expect(authService.deleteTeam).toHaveBeenCalledWith('team-1');
    expect(component.selectedTeam()).toBeNull();
  });

  it('should select a team and load members', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.selectTeam({ id: 'team-1', name: 'Team A', clubId: 'club-1' });
    expect(component.selectedTeam()?.id).toBe('team-1');
    expect(authService.listTeamUsers).toHaveBeenCalledWith('team-1');
  });

  it('should load leagues on init', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authService.listLeagues).toHaveBeenCalled();
    expect(fixture.componentInstance.leagues()).toHaveLength(1);
  });

  it('should switch to Leagues tab', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const leaguesTab = el.querySelectorAll('.sidebar-btn')[3] as HTMLButtonElement;
    leaguesTab.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('leagues');
    expect(leaguesTab.classList.contains('sidebar-btn--active')).toBe(true);
    expect(el.querySelector('h2')?.textContent).toContain('Leagues');
  });

  it('should create a league', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.leagueName.set('Autumn League');
    component.leagueType.set('club');
    await component.createLeague();
    expect(authService.createLeague).toHaveBeenCalledWith('Autumn League', 'club');
    expect(component.leagueName()).toBe('');
  });

  it('should select a league and load detail', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.selectLeague({
      id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null, started: false, archived: false,
    });
    expect(component.selectedLeague()?.id).toBe('league-1');
    expect(authService.getLeagueDetail).toHaveBeenCalledWith('league-1');
    expect(component.leagueDetail()?.standings).toHaveLength(1);
  });

  it('should delete a league', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.deleteLeague('league-1');
    expect(authService.deleteLeague).toHaveBeenCalledWith('league-1');
    expect(component.selectedLeague()).toBeNull();
  });

  it('should archive a league', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.archiveLeague('league-1', true);
    expect(authService.archiveLeague).toHaveBeenCalledWith('league-1', true);
    expect(authService.listLeagues).toHaveBeenCalled();
  });

  it('should unarchive a league', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.archiveLeague('league-1', false);
    expect(authService.archiveLeague).toHaveBeenCalledWith('league-1', false);
    expect(authService.listLeagues).toHaveBeenCalled();
  });

  it('should load leagues with includeArchived=true', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authService.listLeagues).toHaveBeenCalledWith(true);
  });

  it('should generate round robin fixtures', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.selectedLeague.set({
      id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null, started: false, archived: false,
    });
    await component.generateRoundRobin();
    expect(authService.generateRoundRobin).toHaveBeenCalledWith('league-1', {
      days: ['monday'], timeSlots: ['19:00'], force: false,
    });
    expect(authService.getLeagueDetail).toHaveBeenCalledWith('league-1');
  });

  it('should load events on init', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authService.listEvents).toHaveBeenCalled();
    expect(fixture.componentInstance.events()).toHaveLength(1);
  });

  it('should switch to Events tab', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const eventsTab = el.querySelectorAll('.sidebar-btn')[4] as HTMLButtonElement;
    eventsTab.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('events');
    expect(eventsTab.classList.contains('sidebar-btn--active')).toBe(true);
    expect(el.querySelector('h2')?.textContent).toContain('Create Event');
  });

  it('should create an event', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.eventTitle.set('New Match');
    component.eventDate.set('2026-04-01');
    component.eventHostedByName.set('My Club');
    await component.createEvent();
    expect(authService.createEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Match',
      date: '2026-04-01',
      hostedByName: 'My Club',
    }));
    expect(component.eventTitle()).toBe('');
  });

  it('should delete an event', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.deleteEvent('event-1');
    expect(authService.deleteEvent).toHaveBeenCalledWith('event-1');
  });

  it('should switch to Teams tab and show teams', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const teamsTab = el.querySelectorAll('.sidebar-btn')[2] as HTMLButtonElement;
    teamsTab.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('teams');
    expect(teamsTab.classList.contains('sidebar-btn--active')).toBe(true);
    expect(el.querySelector('h2')?.textContent).toContain('Teams');
  });

  it('should create a team from the Teams tab', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.teamClubId.set('club-1');
    component.teamName.set('New Team');
    await component.createTeamFromTab();
    expect(authService.createTeam).toHaveBeenCalledWith('New Team', 'club-1');
    expect(component.teamName()).toBe('');
    expect(component.teamClubId()).toBe('');
  });
});
