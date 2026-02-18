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
    expect(el.querySelector('h1')?.textContent).toContain('Organisation dashboard');
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
    const items = el.querySelectorAll('.invite-list li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('pending@test.com');
  });

  it('should send invite and show success message', async () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.inviteEmail = 'new@test.com';
    await component.sendInvite();
    fixture.detectChanges();
    expect(authService.inviteUser).toHaveBeenCalledWith('new@test.com');
    expect(component.inviteSuccess).toContain('new@test.com');
    expect(component.inviteEmail).toBe('');
  });

  it('should show error on invite failure', async () => {
    authService.inviteUser.mockRejectedValue({ error: { message: 'Something went wrong' } });
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.inviteEmail = 'fail@test.com';
    await component.sendInvite();
    expect(component.inviteError).toBe('Something went wrong');
  });
});
