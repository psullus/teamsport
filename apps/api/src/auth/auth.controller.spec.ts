import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { OrganisationService } from './organisation.service';
import { InviteService } from './invite.service';

const mockUser = {
  id: 'user-1',
  organisationName: 'Org',
  organisationId: 'org-1',
  email: 'a@b.com',
  emailVerified: false,
  role: 'ADMIN' as const,
};

const mockAuthService = {
  signup: vi.fn().mockResolvedValue({ user: mockUser, token: 'jwt' }),
  login: vi.fn().mockResolvedValue({ user: mockUser, token: 'jwt' }),
  getMe: vi.fn().mockResolvedValue(mockUser),
  verifyEmail: vi.fn().mockResolvedValue(undefined),
};

const mockUserService = {
  listByOrganisation: vi.fn().mockResolvedValue([mockUser]),
  listAll: vi.fn().mockResolvedValue([mockUser]),
  deleteUser: vi.fn().mockResolvedValue(undefined),
  changeRole: vi.fn().mockResolvedValue({ ...mockUser, role: 'CONTROL' }),
};

const mockOrgService = {
  listAll: vi.fn().mockResolvedValue([{ id: 'org-1', name: 'Org' }]),
  deleteOrganisation: vi.fn().mockResolvedValue(undefined),
};

const mockInviteService = {
  createInvite: vi.fn().mockResolvedValue({ id: 'inv-1', email: 'b@b.com', token: 'tok' }),
  listInvites: vi.fn().mockResolvedValue([]),
  acceptInvite: vi.fn().mockResolvedValue({ user: mockUser, token: 'jwt' }),
};

const mockJwtService = {
  sign: vi.fn(() => 'jwt'),
  verifyAsync: vi.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let res: { cookie: ReturnType<typeof vi.fn>; clearCookie: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    res = { cookie: vi.fn(), clearCookie: vi.fn() };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: OrganisationService, useValue: mockOrgService },
        { provide: InviteService, useValue: mockInviteService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('signup', () => {
    it('should create user, set cookie, and return user', async () => {
      const result = await controller.signup(
        { organisationName: 'Org', email: 'a@b.com', password: 'password123' },
        res as any,
      );

      expect(result).toEqual({ user: mockUser });
      expect(res.cookie).toHaveBeenCalled();
      expect(mockAuthService.signup).toHaveBeenCalledWith('Org', 'a@b.com', 'password123');
    });
  });

  describe('login', () => {
    it('should authenticate and set cookie', async () => {
      const result = await controller.login(
        { email: 'a@b.com', password: 'password123' },
        res as any,
      );

      expect(result).toEqual({ user: mockUser });
      expect(res.cookie).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear cookie', () => {
      const result = controller.logout(res as any);

      expect(result).toEqual({ success: true });
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      const result = await controller.me({ id: 'user-1', role: 'ADMIN' });

      expect(result).toEqual(mockUser);
      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-1');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email token', async () => {
      const result = await controller.verifyEmail('tok');

      expect(result).toEqual({ success: true });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('tok');
    });
  });

  describe('listOrganisations', () => {
    it('should return all organisations', async () => {
      const result = await controller.listOrganisations();

      expect(result).toEqual([{ id: 'org-1', name: 'Org' }]);
    });
  });

  describe('listAllUsers', () => {
    it('should return all users', async () => {
      const result = await controller.listAllUsers();

      expect(result).toEqual([mockUser]);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return success', async () => {
      const result = await controller.deleteUser('user-1');

      expect(result).toEqual({ success: true });
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('changeUserRole', () => {
    it('should change role and return updated user', async () => {
      const result = await controller.changeUserRole('user-1', { role: 'CONTROL' });

      expect(result.role).toBe('CONTROL');
      expect(mockUserService.changeRole).toHaveBeenCalledWith('user-1', 'CONTROL');
    });
  });

  describe('signupWithInvite', () => {
    it('should accept invite, set cookie, and return user', async () => {
      const result = await controller.signupWithInvite(
        { email: 'a@b.com', password: 'password123', inviteToken: 'tok' },
        res as any,
      );

      expect(result).toEqual({ user: mockUser });
      expect(res.cookie).toHaveBeenCalled();
    });
  });
});
