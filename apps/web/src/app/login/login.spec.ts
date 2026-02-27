import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { Login } from './login';

describe('Login', () => {
  let authService: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { login: vi.fn().mockResolvedValue(undefined) };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the login form', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Welcome back');
    expect(el.querySelector('#email')).toBeTruthy();
    expect(el.querySelector('#password')).toBeTruthy();
  });

  it('should call authService.login on submit', async () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component.email = 'user@example.com';
    component.password = 'mypassword';
    await component.onSubmit();
    expect(authService.login).toHaveBeenCalledWith('user@example.com', 'mypassword');
  });

  it('should display error on failure', async () => {
    authService.login.mockRejectedValue({ error: { message: 'Invalid email or password' } });
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component.email = 'bad@test.com';
    component.password = 'wrong';
    await component.onSubmit();
    expect(component.error()).toBe('Invalid email or password');
  });

  it('should have a link to signup page', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('.auth-footer a') as HTMLAnchorElement;
    expect(link.textContent).toContain('Sign up');
  });
});
