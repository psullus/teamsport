import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationBell } from './notification-bell';

function createAuthService() {
  return {
    isLoggedIn: signal(true),
    unreadNotificationCount: signal(3),
    listNotifications: vi.fn().mockResolvedValue([
      { id: 'n1', message: 'Request approved', type: 'join_request_approved', read: false, referenceId: null, createdAt: '2026-03-10T00:00:00.000Z', userId: 'u1' },
      { id: 'n2', message: 'New join request', type: 'join_request', read: false, referenceId: null, createdAt: '2026-03-09T00:00:00.000Z', userId: 'u1' },
    ]),
    markNotificationRead: vi.fn().mockResolvedValue(undefined),
    markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  };
}

describe('NotificationBell', () => {
  let authService: ReturnType<typeof createAuthService>;

  beforeEach(async () => {
    authService = createAuthService();
    await TestBed.configureTestingModule({
      imports: [NotificationBell],
      providers: [
        { provide: AuthService, useValue: authService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should render the bell button', () => {
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.bell-btn')).toBeTruthy();
  });

  it('should show badge with unread count', () => {
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const badge = el.querySelector('.badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('3');
  });

  it('should not show badge when count is 0', () => {
    authService.unreadNotificationCount = signal(0);
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge')).toBeNull();
  });

  it('should toggle dropdown on click', async () => {
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dropdown')).toBeNull();

    const component = fixture.componentInstance;
    await component.toggle();
    fixture.detectChanges();

    expect(el.querySelector('.dropdown')).toBeTruthy();
    expect(authService.listNotifications).toHaveBeenCalled();
  });

  it('should show notifications in dropdown', async () => {
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    await component.toggle();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.notification-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Request approved');
  });

  it('should dismiss a notification', async () => {
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    await component.toggle();
    fixture.detectChanges();

    await component.dismiss('n1');
    fixture.detectChanges();

    expect(authService.markNotificationRead).toHaveBeenCalledWith('n1');
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.notification-item');
    expect(items.length).toBe(1);
  });

  it('should mark all as read', async () => {
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    await component.toggle();
    fixture.detectChanges();

    await component.markAllRead();
    fixture.detectChanges();

    expect(authService.markAllNotificationsRead).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dropdown-empty')).toBeTruthy();
  });

  it('should not render when logged out', () => {
    authService.isLoggedIn = signal(false);
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.bell-btn')).toBeNull();
  });
});
