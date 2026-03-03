import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Home } from './home';

const mockUser = {
  id: '1',
  organisationName: 'Test Org',
  organisationId: 'org-1',
  email: 'test@example.com',
  emailVerified: true,
  role: 'USER' as const,
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  avatarUrl: null,
};

const mockClubs = [
  {
    id: 'club-1', name: 'Club A', organisationId: 'org-1',
    teams: [
      { id: 'team-1', name: 'Team A1', clubId: 'club-1' },
      { id: 'team-2', name: 'Team A2', clubId: 'club-1' },
    ],
  },
  {
    id: 'club-2', name: 'Club B', organisationId: 'org-1',
    teams: [{ id: 'team-3', name: 'Team B1', clubId: 'club-2' }],
  },
];

const mockTeamMembers = [
  {
    id: '10', email: 'alice@example.com', role: 'USER' as const,
    firstName: 'Alice', lastName: 'Johnson',
    organisationName: 'Test Org', organisationId: 'org-1',
    emailVerified: true, phone: null, avatarUrl: null,
  },
  {
    id: '11', email: 'bob@example.com', role: 'USER' as const,
    firstName: 'Bob', lastName: 'Smith',
    organisationName: 'Test Org', organisationId: 'org-1',
    emailVerified: true, phone: null, avatarUrl: null,
  },
];

const mockLeagues = [
  { id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null },
];

const mockLeagueDetail = {
  league: mockLeagues[0],
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
    {
      participantId: 'club-2', participantName: 'Club B',
      played: 1, won: 0, drawn: 0, lost: 1, noShows: 0,
      goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 1,
    },
  ],
  topScorers: [{ userId: 'u1', name: 'John Doe', goals: 2 }],
};

const mockEvents = [
  {
    id: 'event-1', title: 'Training', date: '2099-12-01',
    startTime: '18:00', endTime: '19:30', allDay: false,
    primaryContact: 'Coach', secondaryContact: null, hostedByName: 'My Club',
    location: 'Main Pitch', description: 'Weekly training',
    organisationId: 'org-1', createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'event-2', title: 'Past Match', date: '2020-01-01',
    startTime: null, endTime: null, allDay: true,
    primaryContact: null, secondaryContact: null, hostedByName: 'Other Club',
    location: null, description: null,
    organisationId: 'org-1', createdAt: '2026-01-01T00:00:00.000Z',
  },
];

function createAuthService(loggedIn: boolean) {
  return {
    isLoggedIn: signal(loggedIn),
    user: signal(loggedIn ? mockUser : null),
    listMyClubs: vi.fn().mockResolvedValue(mockClubs),
    listTeamUsers: vi.fn().mockResolvedValue(mockTeamMembers),
    listLeagues: vi.fn().mockResolvedValue(mockLeagues),
    getLeagueDetail: vi.fn().mockResolvedValue(mockLeagueDetail),
    listEvents: vi.fn().mockResolvedValue(mockEvents),
  };
}

describe('Home (logged out)', () => {
  let authService: ReturnType<typeof createAuthService>;

  beforeEach(async () => {
    authService = createAuthService(false);
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should show marketing content when logged out', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.hero h1')?.textContent).toContain('Where teams come together');
    expect(el.querySelector('.dashboard')).toBeNull();
  });

  it('should show signup and signin links', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll('.hero-actions a');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Sign Up');
    expect(links[1].textContent).toContain('Sign In');
  });

  it('should show feature cards', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.feature-card');
    expect(cards.length).toBe(3);
  });
});

describe('Home (logged in)', () => {
  let authService: ReturnType<typeof createAuthService>;

  beforeEach(async () => {
    authService = createAuthService(true);
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should show dashboard when logged in', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dashboard')).toBeTruthy();
    expect(el.querySelector('.hero')).toBeNull();
  });

  it('should show welcome heading with user first name', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dashboard-heading')?.textContent).toContain('Welcome, John');
  });

  it('should load and display clubs in sidebar', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.club-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent?.trim()).toBe('Club A');
    expect(items[1].textContent?.trim()).toBe('Club B');
  });

  it('should auto-select first club', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const active = el.querySelector('.club-item--active');
    expect(active?.textContent?.trim()).toBe('Club A');
  });

  it('should display teams for the selected club', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.team-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Team A1');
    expect(cards[1].textContent).toContain('Team A2');
  });

  it('should switch clubs on click', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.club-item');
    (items[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const cards = el.querySelectorAll('.team-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Team B1');
  });

  it('should show empty state when user has no clubs', async () => {
    authService.listMyClubs.mockResolvedValue([]);
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dashboard-empty')).toBeTruthy();
    expect(el.textContent).toContain('not a member of any clubs');
  });

  it('should show team members when a team card is clicked', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.team-card') as NodeListOf<HTMLButtonElement>;
    cards[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(authService.listTeamUsers).toHaveBeenCalledWith('team-1');
    expect(el.querySelector('.team-members-heading')?.textContent).toContain('Team A1');
    const members = el.querySelectorAll('.member-item');
    expect(members.length).toBe(2);
    expect(members[0].textContent).toContain('Alice');
    expect(members[1].textContent).toContain('Bob');
  });

  it('should deselect team when clicking the same card again', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const card = el.querySelectorAll('.team-card')[0] as HTMLButtonElement;
    card.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.team-members')).toBeTruthy();
    card.click();
    fixture.detectChanges();
    expect(el.querySelector('.team-members')).toBeNull();
  });

  it('should clear team selection when switching clubs', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // Select a team
    (el.querySelectorAll('.team-card')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.team-members')).toBeTruthy();
    // Switch club
    (el.querySelectorAll('.club-item')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.team-members')).toBeNull();
  });

  it('should show error state on load failure', async () => {
    authService.listMyClubs.mockRejectedValue(new Error('Network error'));
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dashboard-error')).toBeTruthy();
    expect(el.textContent).toContain('Failed to load clubs');
  });

  it('should load and display leagues', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(authService.listLeagues).toHaveBeenCalled();
    const cards = el.querySelectorAll('.league-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Spring League');
  });

  it('should show league detail when a league card is clicked', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const card = el.querySelector('.league-card') as HTMLButtonElement;
    card.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(authService.getLeagueDetail).toHaveBeenCalledWith('league-1');
    expect(el.querySelector('.league-detail')).toBeTruthy();
    expect(el.querySelector('.standings-table')).toBeTruthy();
    const rows = el.querySelectorAll('.standings-table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Club A');
  });

  it('should deselect league when clicking the same card again', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const card = el.querySelector('.league-card') as HTMLButtonElement;
    card.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.league-detail')).toBeTruthy();
    card.click();
    fixture.detectChanges();
    expect(el.querySelector('.league-detail')).toBeNull();
  });

  it('should load and display events', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(authService.listEvents).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.events-section')).toBeTruthy();
    expect(el.querySelector('.events-heading')?.textContent).toContain('Events');
  });

  it('should show upcoming events by default', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.event-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Training');
  });

  it('should switch to past events tab', async () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const pastBtn = el.querySelectorAll('.event-tab-btn')[1] as HTMLButtonElement;
    pastBtn.click();
    fixture.detectChanges();
    const cards = el.querySelectorAll('.event-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Past Match');
  });
});
