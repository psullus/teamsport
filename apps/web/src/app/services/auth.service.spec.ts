import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  id: '1',
  organisationName: 'My Org',
  organisationId: 'org-1',
  email: 'test@example.com',
  emailVerified: false,
  role: 'ADMIN' as const,
  firstName: null,
  lastName: null,
  phone: null,
  avatarUrl: null,
  ...overrides,
});

function flushRestoreSession(httpTesting: HttpTestingController) {
  const req = httpTesting.expectOne('/api/auth/me');
  req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
}

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
    flushRestoreSession(httpTesting);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should start logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should sign up via HTTP and navigate to /verify-email-notice', async () => {
    const promise = service.signup('My Org', 'test@example.com', 'pass1234', 'Club', 'Touch', 'Team');

    const req = httpTesting.expectOne('/api/auth/signup');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      organisationName: 'My Org',
      email: 'test@example.com',
      password: 'pass1234',
      clubName: 'Club',
      clubType: 'Touch',
      teamName: 'Team',
    });
    req.flush({ user: mockUser() });

    await promise;
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.organisationName).toBe('My Org');
    expect(service.user()?.role).toBe('ADMIN');
    expect(service.isAdmin()).toBe(true);
    expect(service.isAdminOrControl()).toBe(true);
    expect(service.isControl()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/verify-email-notice');
  });

  it('should login via HTTP and navigate to /', async () => {
    const promise = service.login('user@example.com', 'password');

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      user: mockUser({
        id: '2',
        organisationName: 'Some Org',
        organisationId: 'org-2',
        email: 'user@example.com',
        emailVerified: true,
        role: 'USER',
      }),
    });

    await promise;
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.email).toBe('user@example.com');
    expect(service.user()?.role).toBe('USER');
    expect(service.isAdmin()).toBe(false);
    expect(service.isControl()).toBe(false);
    expect(service.isAdminOrControl()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should signup with invite token and navigate to /', async () => {
    const promise = service.signupWithInvite('inv@test.com', 'pass1234', 'invite-uuid');

    const req = httpTesting.expectOne('/api/auth/signup/invite');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'inv@test.com',
      password: 'pass1234',
      inviteToken: 'invite-uuid',
    });
    req.flush({
      user: mockUser({
        id: '3',
        organisationName: 'Team Org',
        organisationId: 'org-3',
        email: 'inv@test.com',
        emailVerified: true,
        role: 'USER',
      }),
    });

    await promise;
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.role).toBe('USER');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should logout via POST, clear user, and navigate to /', async () => {
    // First log in
    const loginPromise = service.signup('Org', 'a@b.com', 'password', 'Club', 'Touch', 'Team');
    httpTesting.expectOne('/api/auth/signup').flush({ user: mockUser() });
    await loginPromise;

    router.navigateByUrl.mockClear();
    const logoutPromise = service.logout();

    const req = httpTesting.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({});

    await logoutPromise;
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should return user initials from organisationName', async () => {
    const promise = service.signup('River Valley FC', 'rv@example.com', 'password', 'Club', 'Touch', 'Team');
    httpTesting.expectOne('/api/auth/signup').flush({
      user: mockUser({ organisationName: 'River Valley FC', email: 'rv@example.com' }),
    });
    await promise;

    expect(service.getUserInitials()).toBe('RVF');
  });

  it('should return empty initials when logged out', () => {
    expect(service.getUserInitials()).toBe('');
  });

  it('should verify email via HTTP GET', async () => {
    const promise = service.verifyEmail('test-token');

    const req = httpTesting.expectOne(
      (r) => r.url === '/api/auth/verify-email' && r.params.get('token') === 'test-token',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'Email verified' });

    await promise;
  });

  it('isControl should be true for CONTROL user', async () => {
    const promise = service.login('ctrl@system.com', 'password');
    httpTesting.expectOne('/api/auth/login').flush({
      user: mockUser({
        id: '10',
        organisationName: 'System',
        organisationId: 'sys-org',
        email: 'ctrl@system.com',
        emailVerified: true,
        role: 'CONTROL',
      }),
    });
    await promise;

    expect(service.isControl()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.isAdminOrControl()).toBe(true);
  });

  it('should invite user via HTTP POST', async () => {
    const promise = service.inviteUser('new@test.com');

    const req = httpTesting.expectOne('/api/auth/invites');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'new@test.com' });
    req.flush({ id: 'inv-1', email: 'new@test.com', token: 'inv-token' });

    await promise;
  });

  it('should list org users via HTTP GET', async () => {
    const promise = service.listOrgUsers();

    const req = httpTesting.expectOne('/api/auth/org/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', email: 'a@b.com', role: 'ADMIN' }]);

    const result = await promise;
    expect(result).toHaveLength(1);
  });

  it('should list all organisations via HTTP GET', async () => {
    const promise = service.listAllOrganisations();

    const req = httpTesting.expectOne('/api/auth/organisations');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'org-1', name: 'Test FC' }]);

    const result = await promise;
    expect(result).toHaveLength(1);
  });

  it('should delete user via HTTP DELETE', async () => {
    const promise = service.deleteUser('user-1');

    const req = httpTesting.expectOne('/api/auth/users/user-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'User deleted' });

    await promise;
  });

  it('should change user role via HTTP PATCH', async () => {
    const promise = service.changeUserRole('user-1', 'ADMIN');

    const req = httpTesting.expectOne('/api/auth/users/user-1/role');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'ADMIN' });
    req.flush({ id: 'user-1', role: 'ADMIN' });

    const result = await promise;
    expect(result.role).toBe('ADMIN');
  });

  it('should list my clubs via HTTP GET', async () => {
    const clubs = [
      {
        id: 'club-1', name: 'Club A', organisationId: 'org-1',
        teams: [{ id: 'team-1', name: 'Team A1', clubId: 'club-1' }],
      },
    ];
    const promise = service.listMyClubs();

    const req = httpTesting.expectOne('/api/auth/me/clubs');
    expect(req.request.method).toBe('GET');
    req.flush(clubs);

    const result = await promise;
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Club A');
    expect(result[0].teams).toHaveLength(1);
  });

  it('should update profile via PATCH and update currentUser signal', async () => {
    const formData = new FormData();
    formData.append('firstName', 'John');
    const promise = service.updateProfile(formData);

    const req = httpTesting.expectOne('/api/auth/profile');
    expect(req.request.method).toBe('PATCH');
    req.flush(mockUser({ firstName: 'John' }));

    const result = await promise;
    expect(result.firstName).toBe('John');
    expect(service.user()?.firstName).toBe('John');
  });

  it('should remove avatar via DELETE and update currentUser signal', async () => {
    // First log in
    const loginPromise = service.login('a@b.com', 'password');
    httpTesting.expectOne('/api/auth/login').flush({
      user: mockUser({ avatarUrl: '/api/uploads/avatars/old.jpg' }),
    });
    await loginPromise;

    const promise = service.removeAvatar();

    const req = httpTesting.expectOne('/api/auth/profile/avatar');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockUser({ avatarUrl: null }));

    const result = await promise;
    expect(result.avatarUrl).toBeNull();
    expect(service.user()?.avatarUrl).toBeNull();
  });

  it('should list leagues via HTTP GET', async () => {
    const promise = service.listLeagues();

    const req = httpTesting.expectOne('/api/auth/leagues');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'l1', name: 'Spring', type: 'club' }]);

    const result = await promise;
    expect(result).toHaveLength(1);
  });

  it('should get league detail via HTTP GET', async () => {
    const promise = service.getLeagueDetail('league-1');

    const req = httpTesting.expectOne('/api/auth/leagues/league-1');
    expect(req.request.method).toBe('GET');
    req.flush({
      league: { id: 'league-1', name: 'Spring' },
      fixtures: [], standings: [], topScorers: [],
    });

    const result = await promise;
    expect(result.league.name).toBe('Spring');
  });

  it('should create league via HTTP POST', async () => {
    const promise = service.createLeague('Spring', 'club');

    const req = httpTesting.expectOne('/api/auth/leagues');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Spring', type: 'club', clubId: undefined });
    req.flush({ id: 'l1', name: 'Spring', type: 'club' });

    const result = await promise;
    expect(result.name).toBe('Spring');
  });

  it('should delete league via HTTP DELETE', async () => {
    const promise = service.deleteLeague('league-1');

    const req = httpTesting.expectOne('/api/auth/leagues/league-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    await promise;
  });

  it('should create fixture via HTTP POST', async () => {
    const promise = service.createFixture('league-1', 'club-1', 'club-2');

    const req = httpTesting.expectOne('/api/auth/leagues/league-1/fixtures');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ homeId: 'club-1', awayId: 'club-2', date: undefined });
    req.flush({ id: 'f1', homeId: 'club-1', awayId: 'club-2', status: 'scheduled' });

    const result = await promise;
    expect(result.homeId).toBe('club-1');
  });

  it('should update fixture via HTTP PATCH', async () => {
    const promise = service.updateFixture('fixture-1', { homeScore: 2, awayScore: 1 });

    const req = httpTesting.expectOne('/api/auth/fixtures/fixture-1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'fixture-1', homeScore: 2, awayScore: 1, status: 'completed' });

    const result = await promise;
    expect(result.homeScore).toBe(2);
  });

  it('should delete fixture via HTTP DELETE', async () => {
    const promise = service.deleteFixture('fixture-1');

    const req = httpTesting.expectOne('/api/auth/fixtures/fixture-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    await promise;
  });

  it('should create goal via HTTP POST', async () => {
    const promise = service.createGoal('fixture-1', 'user-1');

    const req = httpTesting.expectOne('/api/auth/fixtures/fixture-1/goals');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ scorerId: 'user-1' });
    req.flush({ id: 'g1', fixtureId: 'fixture-1', scorerId: 'user-1', scorerName: 'John' });

    const result = await promise;
    expect(result.scorerName).toBe('John');
  });

  it('should delete goal via HTTP DELETE', async () => {
    const promise = service.deleteGoal('goal-1');

    const req = httpTesting.expectOne('/api/auth/goals/goal-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    await promise;
  });

  it('should list events via HTTP GET', async () => {
    const promise = service.listEvents();

    const req = httpTesting.expectOne('/api/auth/events');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'e1', title: 'Training' }]);

    const result = await promise;
    expect(result).toHaveLength(1);
  });

  it('should create event via HTTP POST', async () => {
    const promise = service.createEvent({
      title: 'Training',
      date: '2026-03-10',
      startTime: null,
      endTime: null,
      allDay: false,
      primaryContact: null,
      secondaryContact: null,
      hostedByName: 'My Club',
      location: null,
      description: null,
    });

    const req = httpTesting.expectOne('/api/auth/events');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Training');
    req.flush({ id: 'e1', title: 'Training' });

    const result = await promise;
    expect(result.title).toBe('Training');
  });

  it('should update event via HTTP PATCH', async () => {
    const promise = service.updateEvent('event-1', { title: 'Updated' });

    const req = httpTesting.expectOne('/api/auth/events/event-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ title: 'Updated' });
    req.flush({ id: 'event-1', title: 'Updated' });

    const result = await promise;
    expect(result.title).toBe('Updated');
  });

  it('should delete event via HTTP DELETE', async () => {
    const promise = service.deleteEvent('event-1');

    const req = httpTesting.expectOne('/api/auth/events/event-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    await promise;
  });
});

describe('AuthService (session restore)', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: vi.fn().mockResolvedValue(true) } },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should restore session from cookie on init', () => {
    const req = httpTesting.expectOne('/api/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: '5',
      organisationName: 'Restored Org',
      organisationId: 'org-5',
      email: 'restored@test.com',
      emailVerified: true,
      role: 'ADMIN',
    });

    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.organisationName).toBe('Restored Org');
  });

  it('should silently handle 401 on session restore', () => {
    const req = httpTesting.expectOne('/api/auth/me');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isLoggedIn()).toBe(false);
  });
});
