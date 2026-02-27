import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubEntity } from './entities/club.entity';
import { UserEntity } from './entities/user.entity';

const mockClubRepo = {
  create: vi.fn((data) => ({ ...data, id: 'club-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
};

const mockUserRepo = {
  findOne: vi.fn(),
};

describe('ClubService', () => {
  let service: ClubService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ClubService,
        { provide: getRepositoryToken(ClubEntity), useValue: mockClubRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(ClubService);
  });

  describe('create', () => {
    it('should create a club and return response', async () => {
      mockClubRepo.create.mockReturnValue({ id: 'club-1', name: 'A Club' });
      mockClubRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.create('A Club', 'org-1');

      expect(result.id).toBe('club-1');
      expect(result.name).toBe('A Club');
      expect(result.organisationId).toBe('org-1');
      expect(mockClubRepo.save).toHaveBeenCalled();
    });
  });

  describe('listByOrganisation', () => {
    it('should return clubs for organisation', async () => {
      mockClubRepo.find.mockResolvedValue([
        { id: 'club-1', name: 'Club A', organisation: { id: 'org-1' } },
        { id: 'club-2', name: 'Club B', organisation: { id: 'org-1' } },
      ]);

      const result = await service.listByOrganisation('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Club A');
    });
  });

  describe('addUser', () => {
    it('should add user to club', async () => {
      const club = { id: 'club-1', members: [] as any[] };
      const user = { id: 'user-1' };
      mockClubRepo.findOne.mockResolvedValue(club);
      mockUserRepo.findOne.mockResolvedValue(user);

      await service.addUser('club-1', 'user-1');

      expect(club.members).toContain(user);
      expect(mockClubRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.addUser('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockClubRepo.findOne.mockResolvedValue({ id: 'club-1', members: [] });
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.addUser('club-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUser', () => {
    it('should remove user from club', async () => {
      const club = { id: 'club-1', members: [{ id: 'user-1' }, { id: 'user-2' }] };
      mockClubRepo.findOne.mockResolvedValue(club);

      await service.removeUser('club-1', 'user-1');

      expect(club.members).toHaveLength(1);
      expect(club.members[0].id).toBe('user-2');
    });
  });

  describe('rename', () => {
    it('should rename a club', async () => {
      const club = { id: 'club-1', name: 'Old Name', organisation: { id: 'org-1' } };
      mockClubRepo.findOne.mockResolvedValue(club);
      mockClubRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.rename('club-1', 'New Name');

      expect(result.name).toBe('New Name');
      expect(mockClubRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.rename('bad', 'Name')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a club', async () => {
      const club = { id: 'club-1' };
      mockClubRepo.findOne.mockResolvedValue(club);

      await service.delete('club-1');

      expect(mockClubRepo.remove).toHaveBeenCalledWith(club);
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUsers', () => {
    it('should return club members', async () => {
      mockClubRepo.findOne.mockResolvedValue({
        id: 'club-1',
        members: [
          {
            id: 'user-1',
            email: 'a@b.com',
            emailVerified: true,
            role: 'ADMIN',
            organisation: { id: 'org-1', name: 'Org' },
          },
        ],
      });

      const result = await service.listUsers('club-1');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('a@b.com');
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.listUsers('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
