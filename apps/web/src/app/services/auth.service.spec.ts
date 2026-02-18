import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    router = { navigateByUrl: vi.fn() };
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
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should start logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should sign up via HTTP and navigate to /verify-email-notice', async () => {
    const promise = service.signup('My Org', 'test@example.com', 'pass1234');

    const req = httpTesting.expectOne('/api/auth/signup');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      organisationName: 'My Org',
      email: 'test@example.com',
      password: 'pass1234',
    });
    req.flush({
      user: {
        id: '1',
        organisationName: 'My Org',
        organisationId: 'org-1',
        email: 'test@example.com',
        emailVerified: false,
        role: 'ADMIN',
      },
      accessToken: 'jwt-token',
    });

    await promise;
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.organisationName).toBe('My Org');
    expect(service.user()?.role).toBe('ADMIN');
    expect(service.isAdmin()).toBe(true);
    expect(service.isAdminOrControl()).toBe(true);
    expect(service.isControl()).toBe(false);
    expect(localStorage.getItem('accessToken')).toBe('jwt-token');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/verify-email-notice');
  });

  it('should login via HTTP and navigate to /', async () => {
    const promise = service.login('user@example.com', 'password');

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      user: {
        id: '2',
        organisationName: 'Some Org',
        organisationId: 'org-2',
        email: 'user@example.com',
        emailVerified: true,
        role: 'USER',
      },
      accessToken: 'jwt-token-2',
    });

    await promise;
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.email).toBe('user@example.com');
    expect(service.user()?.role).toBe('USER');
    expect(service.isAdmin()).toBe(false);
    expect(service.isControl()).toBe(false);
    expect(service.isAdminOrControl()).toBe(false);
    expect(localStorage.getItem('accessToken')).toBe('jwt-token-2');
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
      user: {
        id: '3',
        organisationName: 'Team Org',
        organisationId: 'org-3',
        email: 'inv@test.com',
        emailVerified: true,
        role: 'USER',
      },
      accessToken: 'jwt-invite',
    });

    await promise;
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.role).toBe('USER');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should logout, clear token, and navigate to /', async () => {
    const promise = service.signup('Org', 'a@b.com', 'password');
    httpTesting.expectOne('/api/auth/signup').flush({
      user: {
        id: '1',
        organisationName: 'Org',
        organisationId: 'org-1',
        email: 'a@b.com',
        emailVerified: false,
        role: 'ADMIN',
      },
      accessToken: 'token',
    });
    await promise;

    router.navigateByUrl.mockClear();
    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should return user initials from organisationName', async () => {
    const promise = service.signup('River Valley FC', 'rv@example.com', 'password');
    httpTesting.expectOne('/api/auth/signup').flush({
      user: {
        id: '1',
        organisationName: 'River Valley FC',
        organisationId: 'org-1',
        email: 'rv@example.com',
        emailVerified: false,
        role: 'ADMIN',
      },
      accessToken: 'token',
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
      user: {
        id: '10',
        organisationName: 'System',
        organisationId: 'sys-org',
        email: 'ctrl@system.com',
        emailVerified: true,
        role: 'CONTROL',
      },
      accessToken: 'ctrl-token',
    });
    await promise;

    expect(service.isControl()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.isAdminOrControl()).toBe(true);
  });

  it('should invite user via HTTP POST', async () => {
    localStorage.setItem('accessToken', 'admin-token');
    const promise = service.inviteUser('new@test.com');

    const req = httpTesting.expectOne('/api/auth/invites');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'new@test.com' });
    expect(req.request.headers.get('Authorization')).toBe('Bearer admin-token');
    req.flush({ id: 'inv-1', email: 'new@test.com', token: 'inv-token' });

    await promise;
  });

  it('should list org users via HTTP GET', async () => {
    localStorage.setItem('accessToken', 'admin-token');
    const promise = service.listOrgUsers();

    const req = httpTesting.expectOne('/api/auth/org/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', email: 'a@b.com', role: 'ADMIN' }]);

    const result = await promise;
    expect(result).toHaveLength(1);
  });

  it('should list all organisations via HTTP GET', async () => {
    localStorage.setItem('accessToken', 'ctrl-token');
    const promise = service.listAllOrganisations();

    const req = httpTesting.expectOne('/api/auth/organisations');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'org-1', name: 'Test FC' }]);

    const result = await promise;
    expect(result).toHaveLength(1);
  });

  it('should delete user via HTTP DELETE', async () => {
    localStorage.setItem('accessToken', 'ctrl-token');
    const promise = service.deleteUser('user-1');

    const req = httpTesting.expectOne('/api/auth/users/user-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'User deleted' });

    await promise;
  });

  it('should change user role via HTTP PATCH', async () => {
    localStorage.setItem('accessToken', 'ctrl-token');
    const promise = service.changeUserRole('user-1', 'ADMIN');

    const req = httpTesting.expectOne('/api/auth/users/user-1/role');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'ADMIN' });
    req.flush({ id: 'user-1', role: 'ADMIN' });

    const result = await promise;
    expect(result.role).toBe('ADMIN');
  });
});

describe('AuthService (session restore)', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'saved-token');
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should restore session from localStorage on init', () => {
    const req = httpTesting.expectOne('/api/auth/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer saved-token');
    req.flush({
      id: '5',
      organisationName: 'Restored Org',
      organisationId: 'org-5',
      email: 'restored@test.com',
      emailVerified: true,
      role: 'ADMIN',
    });
  });
});
