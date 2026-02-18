import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteEntity } from './entities/invite.entity';
import { UserEntity } from './entities/user.entity';
import { OrganisationEntity } from './entities/organisation.entity';

const mockInviteRepo = {
  findOne: vi.fn(),
  find: vi.fn(),
  create: vi.fn((data) => ({ ...data, id: 'inv-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  remove: vi.fn(),
};

const mockUserRepo = {
  findOne: vi.fn(),
  create: vi.fn((data) => ({ ...data, id: 'user-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
};

const mockOrgRepo = {
  findOne: vi.fn(),
};

const mockJwtService = {
  sign: vi.fn(() => 'signed-jwt'),
};

describe('InviteService', () => {
  let service: InviteService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: getRepositoryToken(InviteEntity), useValue: mockInviteRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: getRepositoryToken(OrganisationEntity), useValue: mockOrgRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get(InviteService);
  });

  describe('createInvite', () => {
    it('should create an invite for a new email', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'inviter-1',
          organisation: { id: 'org-1', name: 'Org' },
        });

      const result = await service.createInvite('new@user.com', 'inviter-1', 'org-1');

      expect(result.email).toBe('new@user.com');
      expect(mockInviteRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createInvite('existing@user.com', 'inviter-1', 'org-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvite', () => {
    it('should throw BadRequestException for invalid token', async () => {
      mockInviteRepo.findOne.mockResolvedValue(null);

      await expect(
        service.acceptInvite('a@b.com', 'pass', 'bad-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email does not match', async () => {
      mockInviteRepo.findOne.mockResolvedValue({
        email: 'invited@user.com',
        token: 'tok',
        organisation: { id: 'org-1' },
      });

      await expect(
        service.acceptInvite('wrong@user.com', 'pass', 'tok'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listInvites', () => {
    it('should return invites for the organisation', async () => {
      mockInviteRepo.find.mockResolvedValue([
        { id: 'inv-1', email: 'a@b.com', token: 'tok' },
      ]);

      const result = await service.listInvites('org-1');

      expect(result).toHaveLength(1);
      expect(mockInviteRepo.find).toHaveBeenCalled();
    });
  });
});
