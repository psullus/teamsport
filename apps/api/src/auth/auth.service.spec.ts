import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService, toUserResponse } from './auth.service';
import { UserEntity } from './entities/user.entity';
import { OrganisationEntity } from './entities/organisation.entity';
import { EmailVerificationTokenEntity } from './entities/email-verification-token.entity';
import { ClubEntity } from './entities/club.entity';
import { ClubMemberEntity } from './entities/club-member.entity';
import { TeamEntity } from './entities/team.entity';

const mockUserRepo = {
  findOne: vi.fn(),
  create: vi.fn((data) => ({ ...data, id: 'user-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  delete: vi.fn(),
};

const mockOrgRepo = {
  create: vi.fn((data) => ({ ...data, id: 'org-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
};

const mockEmailTokenRepo = {
  findOne: vi.fn(),
  create: vi.fn((data) => data),
  save: vi.fn((entity) => Promise.resolve(entity)),
  remove: vi.fn(),
};

const mockClubRepo = {
  create: vi.fn((data) => ({ ...data, id: 'club-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
};

const mockClubMemberRepo = {
  create: vi.fn((data) => ({ ...data, id: 'cm-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
};

const mockTeamRepo = {
  create: vi.fn((data) => ({ ...data, id: 'team-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
};

const mockJwtService = {
  sign: vi.fn(() => 'signed-jwt'),
  verifyAsync: vi.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: getRepositoryToken(OrganisationEntity), useValue: mockOrgRepo },
        {
          provide: getRepositoryToken(EmailVerificationTokenEntity),
          useValue: mockEmailTokenRepo,
        },
        { provide: getRepositoryToken(ClubEntity), useValue: mockClubRepo },
        { provide: getRepositoryToken(ClubMemberEntity), useValue: mockClubMemberRepo },
        { provide: getRepositoryToken(TeamEntity), useValue: mockTeamRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('toUserResponse', () => {
    it('should map entity to shared User interface', () => {
      const entity = {
        id: 'u1',
        email: 'a@b.com',
        emailVerified: false,
        role: 'ADMIN' as const,
        organisation: { id: 'o1', name: 'Org' },
        firstName: null,
        lastName: null,
        phone: null,
        avatarPath: null,
      } as UserEntity;

      const result = toUserResponse(entity);

      expect(result).toEqual({
        id: 'u1',
        organisationName: 'Org',
        organisationId: 'o1',
        email: 'a@b.com',
        emailVerified: false,
        role: 'ADMIN',
        firstName: null,
        lastName: null,
        phone: null,
        avatarUrl: null,
      });
    });

    it('should map avatarPath to avatarUrl', () => {
      const entity = {
        id: 'u1',
        email: 'a@b.com',
        emailVerified: false,
        role: 'ADMIN' as const,
        organisation: { id: 'o1', name: 'Org' },
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-1234',
        avatarPath: 'avatars/abc.jpg',
      } as UserEntity;

      const result = toUserResponse(entity);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.phone).toBe('555-1234');
      expect(result.avatarUrl).toBe('/api/uploads/avatars/abc.jpg');
    });
  });

  describe('signup', () => {
    it('should create org, club with type, user, membership, and return JWT', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockOrgRepo.create.mockReturnValue({ id: 'org-1', name: 'Test Org' });
      mockOrgRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockUserRepo.create.mockReturnValue({
        id: 'user-1',
        email: 'a@b.com',
        role: 'ADMIN',
        emailVerified: false,
        organisation: { id: 'org-1', name: 'Test Org' },
      });
      mockUserRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockEmailTokenRepo.create.mockReturnValue({ token: 'tok' });
      mockClubRepo.create.mockReturnValue({ id: 'club-1', name: 'My Club', type: 'Soccer' });
      mockClubRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockClubMemberRepo.create.mockReturnValue({ id: 'cm-1' });
      mockClubMemberRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockTeamRepo.create.mockReturnValue({ id: 'team-1', name: 'My Team' });
      mockTeamRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.signup(
        'Test Org', 'a@b.com', 'password123', 'My Club', 'Soccer', 'My Team',
      );

      expect(result.user.email).toBe('a@b.com');
      expect(result.user.role).toBe('ADMIN');
      expect(result.token).toBe('signed-jwt');
      expect(mockOrgRepo.save).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockClubRepo.save).toHaveBeenCalled();
      expect(mockClubMemberRepo.save).toHaveBeenCalled();
      expect(mockTeamRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.signup('Org', 'a@b.com', 'pass', 'Club', 'Touch', 'Team'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.login('no@user.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: '$2b$10$invalidhash',
        role: 'ADMIN',
        organisation: { id: 'org-1', name: 'Org' },
      });

      await expect(service.login('a@b.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return user response for valid user', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        emailVerified: true,
        role: 'ADMIN',
        organisation: { id: 'org-1', name: 'Org' },
      });

      const result = await service.getMe('user-1');

      expect(result.email).toBe('a@b.com');
      expect(result.organisationName).toBe('Org');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should set emailVerified to true and remove token', async () => {
      const user = { id: 'u1', emailVerified: false };
      const emailToken = { token: 'tok', user };
      mockEmailTokenRepo.findOne.mockResolvedValue(emailToken);

      await service.verifyEmail('tok');

      expect(user.emailVerified).toBe(true);
      expect(mockUserRepo.save).toHaveBeenCalledWith(user);
      expect(mockEmailTokenRepo.remove).toHaveBeenCalledWith(emailToken);
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockEmailTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('bad')).rejects.toThrow(BadRequestException);
    });
  });
});
