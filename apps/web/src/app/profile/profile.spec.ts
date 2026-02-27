import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { AuthService, User } from '../services/auth.service';
import { Profile } from './profile';

const mockUser: User = {
  id: '1',
  organisationName: 'Test Org',
  organisationId: 'org-1',
  email: 'test@example.com',
  emailVerified: true,
  role: 'ADMIN',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234',
  avatarUrl: '/api/uploads/avatars/abc.jpg',
};

function createMockAuthService(user: User | null = mockUser) {
  const currentUser = signal<User | null>(user);
  return {
    user: currentUser.asReadonly(),
    getUserInitials: () => {
      const name = currentUser()?.organisationName ?? '';
      return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase();
    },
  };
}

describe('Profile', () => {
  let authService: ReturnType<typeof createMockAuthService>;

  beforeEach(async () => {
    authService = createMockAuthService();
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Profile);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display user name', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.display-name')?.textContent).toContain('John');
    expect(el.querySelector('.display-name')?.textContent).toContain('Doe');
  });

  it('should display "No name set" when names are null', async () => {
    authService = createMockAuthService({ ...mockUser, firstName: null, lastName: null });
    TestBed.overrideProvider(AuthService, { useValue: authService });
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.display-name')?.textContent).toContain('No name set');
  });

  it('should display email', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('test@example.com');
  });

  it('should show verified badge when email is verified', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge-verified')).toBeTruthy();
    expect(el.querySelector('.badge-unverified')).toBeNull();
  });

  it('should show unverified badge when email is not verified', async () => {
    authService = createMockAuthService({ ...mockUser, emailVerified: false });
    TestBed.overrideProvider(AuthService, { useValue: authService });
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge-unverified')).toBeTruthy();
    expect(el.querySelector('.badge-verified')).toBeNull();
  });

  it('should display phone number', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('555-1234');
  });

  it('should display "Not set" when phone is null', async () => {
    authService = createMockAuthService({ ...mockUser, phone: null });
    TestBed.overrideProvider(AuthService, { useValue: authService });
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Not set');
  });

  it('should display organisation name', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test Org');
  });

  it('should display role', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('ADMIN');
  });

  it('should show avatar image when user has avatarUrl', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const img = el.querySelector('.avatar-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('/api/uploads/avatars/abc.jpg');
  });

  it('should show initials when user has no avatar', async () => {
    authService = createMockAuthService({ ...mockUser, avatarUrl: null });
    TestBed.overrideProvider(AuthService, { useValue: authService });
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.avatar-img')).toBeNull();
    expect(el.querySelector('.avatar-initials')?.textContent?.trim()).toBe('TO');
  });

  it('should have an "Edit profile" link to /settings', () => {
    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('a.btn-primary') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.textContent?.trim()).toBe('Edit profile');
    expect(link.getAttribute('href')).toBe('/settings');
  });
});
