import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Signup } from './signup';

describe('Signup', () => {
  let authService: {
    signup: ReturnType<typeof vi.fn>;
    signupWithInvite: ReturnType<typeof vi.fn>;
  };

  function setup(queryParams: Record<string, string> = {}) {
    authService = {
      signup: vi.fn().mockResolvedValue(undefined),
      signupWithInvite: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    });
  }

  it('should create the component', () => {
    setup();
    const fixture = TestBed.createComponent(Signup);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the signup form', async () => {
    setup();
    const fixture = TestBed.createComponent(Signup);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Create your account');
    expect(el.querySelector('#organisationName')).toBeTruthy();
    expect(el.querySelector('#clubName')).toBeTruthy();
    expect(el.querySelector('#teamName')).toBeTruthy();
    expect(el.querySelector('#email')).toBeTruthy();
    expect(el.querySelector('#password')).toBeTruthy();
  });

  it('should call authService.signup on submit', async () => {
    setup();
    const fixture = TestBed.createComponent(Signup);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.organisationName = 'Test Club';
    component.clubName = 'My Club';
    component.teamName = 'My Team';
    component.email = 'test@example.com';
    component.password = 'password123';
    await component.onSubmit();
    expect(authService.signup).toHaveBeenCalledWith(
      'Test Club',
      'test@example.com',
      'password123',
      'My Club',
      'My Team',
    );
  });

  it('should display error on failure', async () => {
    setup();
    authService.signup.mockRejectedValue({ error: { message: 'Email already registered' } });
    const fixture = TestBed.createComponent(Signup);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.organisationName = 'Test';
    component.email = 'dup@test.com';
    component.password = 'password123';
    await component.onSubmit();
    expect(component.error()).toBe('Email already registered');
  });

  it('should have a link to login page', async () => {
    setup();
    const fixture = TestBed.createComponent(Signup);
    fixture.detectChanges();
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('.auth-footer a') as HTMLAnchorElement;
    expect(link.textContent).toContain('Log in');
  });

  describe('invite flow', () => {
    it('should hide org/club/team name fields when invite token is present', async () => {
      setup({ invite: 'some-invite-uuid' });
      const fixture = TestBed.createComponent(Signup);
      fixture.detectChanges();
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#organisationName')).toBeNull();
      expect(el.querySelector('#clubName')).toBeNull();
      expect(el.querySelector('#teamName')).toBeNull();
      expect(el.querySelector('h1')?.textContent).toContain('Join your team');
      expect(el.querySelector('button[type="submit"]')?.textContent).toContain('Join team');
    });

    it('should call signupWithInvite on submit with invite token', async () => {
      setup({ invite: 'invite-uuid-123' });
      const fixture = TestBed.createComponent(Signup);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.email = 'invited@test.com';
      component.password = 'password123';
      await component.onSubmit();
      expect(authService.signupWithInvite).toHaveBeenCalledWith(
        'invited@test.com',
        'password123',
        'invite-uuid-123',
      );
      expect(authService.signup).not.toHaveBeenCalled();
    });
  });
});
