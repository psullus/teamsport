import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { VerifyEmail } from './verify-email';

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('VerifyEmail', () => {
  function setup(token: string | null) {
    const authService = { verifyEmail: vi.fn() };
    const route = {
      snapshot: {
        queryParamMap: {
          get: (key: string) => (key === 'token' ? token : null),
        },
      },
    };

    TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: ActivatedRoute, useValue: route },
      ],
    });

    return { authService };
  }

  it('should show success on valid token', async () => {
    const { authService } = setup('valid-token');
    authService.verifyEmail.mockResolvedValue(undefined);

    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Email verified');
    expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token');
  });

  it('should show error on invalid token', async () => {
    const { authService } = setup('bad-token');
    authService.verifyEmail.mockRejectedValue(new Error('Bad request'));

    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Verification failed');
  });

  it('should show error when no token provided', async () => {
    setup(null);

    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Verification failed');
    expect(fixture.componentInstance.error()).toBe('No verification token provided.');
  });
});
