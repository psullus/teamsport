import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, computed } from '@angular/core';
import { AuthService, User, Role } from '../services/auth.service';
import { Help } from './help';

function createMockAuthService(role: Role = 'USER') {
  const currentUser = signal<User | null>({
    id: '1', organisationName: 'Test', organisationId: 'org-1',
    email: 'a@b.com', emailVerified: true, role,
    firstName: null, lastName: null, phone: null, avatarUrl: null,
  });
  return {
    user: currentUser.asReadonly(),
    isLoggedIn: computed(() => currentUser() !== null),
    _setUser: (user: User | null) => currentUser.set(user),
  };
}

describe('Help', () => {
  function setup(role: Role = 'USER') {
    const authService = createMockAuthService(role);
    TestBed.configureTestingModule({
      imports: [Help],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
      ],
    });
    return { authService };
  }

  it('should create the component', () => {
    setup();
    const fixture = TestBed.createComponent(Help);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the help heading', () => {
    setup();
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Help');
  });

  it('should show common help sections for all users', () => {
    setup();
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const headings = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toContain('Getting Started');
    expect(headings).toContain('Your Profile');
    expect(headings).toContain('Organisations');
    expect(headings).toContain('Clubs & Teams');
    expect(headings).toContain('Leagues');
    expect(headings).toContain('Roles & Permissions');
  });

  it('should not show Account Settings section for regular users', () => {
    setup('USER');
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const headings = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).not.toContain('Account Settings');
  });

  it('should show Account Settings section for admin users', () => {
    setup('ADMIN');
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const headings = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toContain('Account Settings');
  });

  it('should not show Control Panel section', () => {
    setup('CONTROL');
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const headings = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).not.toContain('Control Panel');
  });

  it('should list USER and ADMIN roles only', () => {
    setup();
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const roleItems = el.querySelectorAll('.role-item dt');
    const roles = Array.from(roleItems).map((dt) => dt.textContent?.trim());
    expect(roles).toEqual(['USER', 'ADMIN']);
  });

  it('should have a "Back to home" link', () => {
    setup();
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('.auth-footer a') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Back to home');
    expect(link.getAttribute('href')).toBe('/');
  });
});
