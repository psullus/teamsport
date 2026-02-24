import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { AuthService, User } from '../services/auth.service';
import { Settings } from './settings';

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
    updateProfile: vi.fn().mockResolvedValue({
      ...mockUser,
      firstName: 'Jane',
    }),
    removeAvatar: vi.fn().mockResolvedValue({
      ...mockUser,
      avatarUrl: null,
    }),
  };
}

describe('Settings', () => {
  let authService: ReturnType<typeof createMockAuthService>;

  beforeEach(async () => {
    authService = createMockAuthService();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Settings);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should pre-populate form fields from user', () => {
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.firstName).toBe('John');
    expect(component.lastName).toBe('Doe');
    expect(component.phone).toBe('555-1234');
  });

  it('should show avatar preview when user has avatar', () => {
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    expect(fixture.componentInstance.avatarPreview()).toBe('/api/uploads/avatars/abc.jpg');
    const img = fixture.nativeElement.querySelector('.avatar-img') as HTMLImageElement;
    expect(img).toBeTruthy();
  });

  it('should show placeholder when no avatar', async () => {
    authService = createMockAuthService({ ...mockUser, avatarUrl: null });
    TestBed.overrideProvider(AuthService, { useValue: authService });
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.avatar-placeholder')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.avatar-img')).toBeNull();
  });

  it('should call updateProfile with FormData on submit', async () => {
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    fixture.componentInstance.firstName = 'Jane';
    await fixture.componentInstance.onSubmit();
    expect(authService.updateProfile).toHaveBeenCalled();
    const formData = authService.updateProfile.mock.calls[0][0] as FormData;
    expect(formData.get('firstName')).toBe('Jane');
  });

  it('should show success message after save', async () => {
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    await fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.success()).toBe('Profile updated successfully.');
  });

  it('should show error message on failure', async () => {
    authService.updateProfile.mockRejectedValueOnce({ error: { message: 'Server error' } });
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    await fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.error()).toBe('Server error');
  });

  it('should call removeAvatar and clear preview', async () => {
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    await fixture.componentInstance.removeAvatar();
    expect(authService.removeAvatar).toHaveBeenCalled();
    expect(fixture.componentInstance.avatarPreview()).toBeNull();
  });
});
