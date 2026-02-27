import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';

const mockUserRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  delete: vi.fn(),
  save: vi.fn((entity) => Promise.resolve(entity)),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('updateProfile', () => {
    it('should update firstName, lastName, phone', async () => {
      const user = {
        id: 'u1',
        email: 'a@b.com',
        emailVerified: true,
        role: 'ADMIN',
        organisation: { id: 'o1', name: 'Org' },
        firstName: null,
        lastName: null,
        phone: null,
        avatarPath: null,
      } as unknown as UserEntity;
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.updateProfile('u1', {
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-1234',
      });

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.phone).toBe('555-1234');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should set avatarPath when avatar file is provided', async () => {
      const user = {
        id: 'u1',
        email: 'a@b.com',
        emailVerified: true,
        role: 'ADMIN',
        organisation: { id: 'o1', name: 'Org' },
        firstName: null,
        lastName: null,
        phone: null,
        avatarPath: null,
      } as unknown as UserEntity;
      mockUserRepo.findOne.mockResolvedValue(user);

      const fakeFile = { filename: 'abc-123.jpg' } as Express.Multer.File;
      const result = await service.updateProfile('u1', {}, fakeFile);

      expect(result.avatarUrl).toBe('/api/uploads/avatars/abc-123.jpg');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('bad-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserClubsWithTeams', () => {
    it('should return clubs with filtered teams for the user', async () => {
      const user = {
        id: 'u1',
        clubs: [
          { id: 'club-1', name: 'Club A', organisation: { id: 'org-1' } },
          { id: 'club-2', name: 'Club B', organisation: { id: 'org-1' } },
        ],
        teams: [
          { id: 'team-1', name: 'Team A1', club: { id: 'club-1' } },
          { id: 'team-2', name: 'Team A2', club: { id: 'club-1' } },
          { id: 'team-3', name: 'Team B1', club: { id: 'club-2' } },
        ],
      } as unknown as UserEntity;
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.getUserClubsWithTeams('u1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'club-1',
        name: 'Club A',
        organisationId: 'org-1',
        teams: [
          { id: 'team-1', name: 'Team A1', clubId: 'club-1' },
          { id: 'team-2', name: 'Team A2', clubId: 'club-1' },
        ],
      });
      expect(result[1]).toEqual({
        id: 'club-2',
        name: 'Club B',
        organisationId: 'org-1',
        teams: [
          { id: 'team-3', name: 'Team B1', clubId: 'club-2' },
        ],
      });
    });

    it('should return empty teams array for clubs with no matching teams', async () => {
      const user = {
        id: 'u1',
        clubs: [{ id: 'club-1', name: 'Club A', organisation: { id: 'org-1' } }],
        teams: [],
      } as unknown as UserEntity;
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.getUserClubsWithTeams('u1');

      expect(result).toHaveLength(1);
      expect(result[0].teams).toEqual([]);
    });

    it('should throw NotFoundException for unknown user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getUserClubsWithTeams('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAvatar', () => {
    it('should clear avatarPath and return user', async () => {
      const user = {
        id: 'u1',
        email: 'a@b.com',
        emailVerified: true,
        role: 'ADMIN',
        organisation: { id: 'o1', name: 'Org' },
        firstName: null,
        lastName: null,
        phone: null,
        avatarPath: 'avatars/old.jpg',
      } as unknown as UserEntity;
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.removeAvatar('u1');

      expect(result.avatarUrl).toBeNull();
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should handle user with no avatar', async () => {
      const user = {
        id: 'u1',
        email: 'a@b.com',
        emailVerified: true,
        role: 'ADMIN',
        organisation: { id: 'o1', name: 'Org' },
        firstName: null,
        lastName: null,
        phone: null,
        avatarPath: null,
      } as unknown as UserEntity;
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.removeAvatar('u1');

      expect(result.avatarUrl).toBeNull();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.removeAvatar('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
