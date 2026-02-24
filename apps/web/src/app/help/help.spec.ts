import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Help } from './help';

describe('Help', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Help],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Help);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the help heading', () => {
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Help');
  });

  it('should have all help sections', () => {
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const headings = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toContain('Getting Started');
    expect(headings).toContain('Your Profile');
    expect(headings).toContain('Organisations');
    expect(headings).toContain('Clubs & Teams');
    expect(headings).toContain('Roles & Permissions');
    expect(headings).toContain('Admin Dashboard');
    expect(headings).toContain('Control Panel');
  });

  it('should list all three roles', () => {
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const roleItems = el.querySelectorAll('.role-item dt');
    const roles = Array.from(roleItems).map((dt) => dt.textContent?.trim());
    expect(roles).toEqual(['USER', 'ADMIN', 'CONTROL']);
  });

  it('should have a "Back to home" link', () => {
    const fixture = TestBed.createComponent(Help);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('.auth-footer a') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Back to home');
    expect(link.getAttribute('href')).toBe('/');
  });
});
