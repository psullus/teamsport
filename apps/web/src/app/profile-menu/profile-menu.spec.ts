import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, computed } from '@angular/core';
import { AuthService, User } from '../services/auth.service';
import { ProfileMenu } from './profile-menu';

const defaultUser: User = {
  id: '1',
  organisationName: 'Test',
  organisationId: 'org-1',
  email: 'a@b.com',
  emailVerified: true,
  role: 'ADMIN',
  firstName: null,
  lastName: null,
  phone: null,
  avatarUrl: null,
};

function createMockAuthService() {
  const currentUser = signal<User | null>(null);
  return {
    user: currentUser.asReadonly(),
    isLoggedIn: computed(() => currentUser() !== null),
    isControl: computed(() => currentUser()?.role === 'CONTROL'),
    isAdmin: computed(() => currentUser()?.role === 'ADMIN'),
    isAdminOrControl: computed(() => {
      const role = currentUser()?.role;
      return role === 'ADMIN' || role === 'CONTROL';
    }),
    getUserInitials: () => {
      const name = currentUser()?.organisationName ?? '';
      return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase();
    },
    logout: vi.fn(() => {
      currentUser.set(null);
    }),
    _setUser: (user: User | null) => currentUser.set(user),
  };
}

describe('ProfileMenu', () => {
  let authService: ReturnType<typeof createMockAuthService>;

  beforeEach(async () => {
    authService = createMockAuthService();
    await TestBed.configureTestingModule({
      imports: [ProfileMenu],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ProfileMenu);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show nothing when logged out', async () => {
    const fixture = TestBed.createComponent(ProfileMenu);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.btn-primary')).toBeNull();
    expect(el.querySelector('.avatar')).toBeNull();
  });

  it('should show avatar when logged in', async () => {
    authService._setUser({
      ...defaultUser,
      organisationName: 'Test Club',
      email: 'test@test.com',
    });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.avatar')).toBeTruthy();
    expect(el.querySelector('.btn-primary')).toBeNull();
  });

  it('should display user initials in avatar', async () => {
    authService._setUser({
      ...defaultUser,
      organisationName: 'John Doe',
      email: 'jd@test.com',
    });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.detectChanges();
    await fixture.whenStable();
    const avatar = fixture.nativeElement.querySelector('.avatar') as HTMLElement;
    expect(avatar.textContent?.trim()).toBe('JD');
  });

  it('should open dropdown when avatar is clicked', async () => {
    authService._setUser({ ...defaultUser });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.detectChanges();
    await fixture.whenStable();
    const avatar = fixture.nativeElement.querySelector('.avatar') as HTMLElement;
    avatar.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.dropdown')).toBeTruthy();
  });

  it('should set aria-expanded on avatar', async () => {
    authService._setUser({ ...defaultUser });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.detectChanges();
    await fixture.whenStable();
    const avatar = fixture.nativeElement.querySelector('.avatar') as HTMLElement;
    expect(avatar.getAttribute('aria-expanded')).toBe('false');
    avatar.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(avatar.getAttribute('aria-expanded')).toBe('true');
  });

  it('should show organisation name, email, and role in dropdown', async () => {
    authService._setUser({
      ...defaultUser,
      organisationName: 'River Valley FC',
      email: 'rv@example.com',
    });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dropdown-name')?.textContent).toContain('River Valley FC');
    expect(el.querySelector('.dropdown-email')?.textContent).toContain('rv@example.com');
    expect(el.querySelector('.dropdown-role')?.textContent).toContain('ADMIN');
  });

  it('should call authService.logout and close dropdown', async () => {
    authService._setUser({ ...defaultUser });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const logoutBtn = Array.from(
      fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>
    ).find((el) => el.textContent?.includes('Log out'));
    logoutBtn?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authService.logout).toHaveBeenCalled();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should close dropdown on document click', async () => {
    authService._setUser({ ...defaultUser });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    document.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should show "Control panel" link for CONTROL user', async () => {
    authService._setUser({
      ...defaultUser,
      organisationName: 'System',
      organisationId: 'sys-org',
      email: 'ctrl@system.com',
      role: 'CONTROL',
    });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>
    );
    const controlItem = items.find((el) => el.textContent?.includes('Control panel'));
    const adminItem = items.find((el) => el.textContent?.includes('Account settings'));
    expect(controlItem).toBeTruthy();
    expect(adminItem).toBeTruthy();
  });

  it('should show "Account settings" link for ADMIN user', async () => {
    authService._setUser({
      ...defaultUser,
      organisationName: 'Test FC',
      email: 'admin@test.com',
    });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>
    );
    const controlItem = items.find((el) => el.textContent?.includes('Control panel'));
    const adminItem = items.find((el) => el.textContent?.includes('Account settings'));
    expect(controlItem).toBeFalsy();
    expect(adminItem).toBeTruthy();
  });

  it('should not show dashboard links for USER role', async () => {
    authService._setUser({
      ...defaultUser,
      organisationName: 'Test FC',
      email: 'user@test.com',
      role: 'USER',
    });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>
    );
    const controlItem = items.find((el) => el.textContent?.includes('Control panel'));
    const adminItem = items.find((el) => el.textContent?.includes('Account settings'));
    expect(controlItem).toBeFalsy();
    expect(adminItem).toBeFalsy();
  });

  it('should render "View profile" as a link to /profile', async () => {
    authService._setUser({ ...defaultUser });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>
    );
    const profileItem = items.find((el) => el.textContent?.includes('View profile'));
    expect(profileItem).toBeTruthy();
    expect(profileItem?.tagName).toBe('A');
    expect(profileItem?.getAttribute('href')).toBe('/profile');
  });

  it('should render Help as a link to /help', async () => {
    authService._setUser({ ...defaultUser });
    const fixture = TestBed.createComponent(ProfileMenu);
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>
    );
    const helpItem = items.find((el) => el.textContent?.includes('Help'));
    expect(helpItem).toBeTruthy();
    expect(helpItem?.tagName).toBe('A');
    expect(helpItem?.getAttribute('href')).toBe('/help');
  });

});
