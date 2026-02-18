import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { ControlDashboard } from './control-dashboard';

describe('ControlDashboard', () => {
  let authService: {
    listAllOrganisations: ReturnType<typeof vi.fn>;
    listAllUsers: ReturnType<typeof vi.fn>;
    deleteOrganisation: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
    changeUserRole: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      listAllOrganisations: vi.fn().mockResolvedValue([
        { id: 'org-1', name: 'Test FC' },
        { id: 'org-2', name: 'Other FC' },
      ]),
      listAllUsers: vi.fn().mockResolvedValue([
        {
          id: 'u1',
          email: 'admin@test.com',
          organisationName: 'Test FC',
          role: 'ADMIN',
        },
        {
          id: 'u2',
          email: 'user@test.com',
          organisationName: 'Other FC',
          role: 'USER',
        },
      ]),
      deleteOrganisation: vi.fn().mockResolvedValue(undefined),
      deleteUser: vi.fn().mockResolvedValue(undefined),
      changeUserRole: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [ControlDashboard],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ControlDashboard);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the heading', async () => {
    const fixture = TestBed.createComponent(ControlDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Control panel');
  });

  it('should load and display organisations', async () => {
    const fixture = TestBed.createComponent(ControlDashboard);
    const component = fixture.componentInstance;
    await component.loadData();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const tables = el.querySelectorAll('.data-table');
    const orgRows = tables[0].querySelectorAll('tbody tr');
    expect(orgRows.length).toBe(2);
    expect(orgRows[0].textContent).toContain('Test FC');
    expect(orgRows[1].textContent).toContain('Other FC');
  });

  it('should load and display users', async () => {
    const fixture = TestBed.createComponent(ControlDashboard);
    const component = fixture.componentInstance;
    await component.loadData();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const tables = el.querySelectorAll('.data-table');
    const userRows = tables[1].querySelectorAll('tbody tr');
    expect(userRows.length).toBe(2);
    expect(userRows[0].textContent).toContain('admin@test.com');
  });

  it('should delete organisation', async () => {
    const fixture = TestBed.createComponent(ControlDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.deleteOrg('org-1');
    expect(authService.deleteOrganisation).toHaveBeenCalledWith('org-1');
  });

  it('should delete user', async () => {
    const fixture = TestBed.createComponent(ControlDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.deleteUser('u1');
    expect(authService.deleteUser).toHaveBeenCalledWith('u1');
  });

  it('should change user role', async () => {
    const fixture = TestBed.createComponent(ControlDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    await component.onRoleChange('u1', 'USER');
    expect(authService.changeUserRole).toHaveBeenCalledWith('u1', 'USER');
  });
});
