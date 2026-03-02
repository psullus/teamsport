import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubEntity } from './entities/club.entity';
import { ClubMemberEntity } from './entities/club-member.entity';
import { UserEntity } from './entities/user.entity';

const mockClubRepo = {
  create: vi.fn((data) => ({ ...data, id: 'club-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
};

const mockClubMemberRepo = {
  create: vi.fn((data) => ({ ...data, id: 'cm-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
  delete: vi.fn(),
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
        { provide: getRepositoryToken(ClubMemberEntity), useValue: mockClubMemberRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(ClubService);
  });

  describe('create', () => {
    it('should create a club with type and return response', async () => {
      mockClubRepo.create.mockReturnValue({ id: 'club-1', name: 'A Club', type: 'Touch' });
      mockClubRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.create('A Club', 'Touch', 'org-1');

      expect(result.id).toBe('club-1');
      expect(result.name).toBe('A Club');
      expect(result.type).toBe('Touch');
      expect(result.organisationId).toBe('org-1');
      expect(mockClubRepo.save).toHaveBeenCalled();
    });
  });

  describe('listByOrganisation', () => {
    it('should return clubs for organisation', async () => {
      mockClubRepo.find.mockResolvedValue([
        { id: 'club-1', name: 'Club A', type: 'Touch', organisation: { id: 'org-1' } },
        { id: 'club-2', name: 'Club B', type: 'Soccer', organisation: { id: 'org-1' } },
      ]);

      const result = await service.listByOrganisation('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Club A');
      expect(result[0].type).toBe('Touch');
    });
  });

  describe('addUser', () => {
    it('should create a club membership', async () => {
      mockClubRepo.findOne.mockResolvedValue({ id: 'club-1' });
      mockUserRepo.findOne.mockResolvedValue({ id: 'user-1' });
      mockClubMemberRepo.create.mockReturnValue({ id: 'cm-1' });

      await service.addUser('club-1', 'user-1');

      expect(mockClubMemberRepo.create).toHaveBeenCalled();
      expect(mockClubMemberRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.addUser('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockClubRepo.findOne.mockResolvedValue({ id: 'club-1' });
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.addUser('club-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUser', () => {
    it('should delete club membership', async () => {
      mockClubMemberRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removeUser('club-1', 'user-1');

      expect(mockClubMemberRepo.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if membership not found', async () => {
      mockClubMemberRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.removeUser('club-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a club name and type', async () => {
      const club = { id: 'club-1', name: 'Old Name', type: 'Touch', organisation: { id: 'org-1' } };
      mockClubRepo.findOne.mockResolvedValue(club);
      mockClubRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.update('club-1', 'New Name', 'Soccer');

      expect(result.name).toBe('New Name');
      expect(result.type).toBe('Soccer');
      expect(mockClubRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad', 'Name')).rejects.toThrow(NotFoundException);
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
    it('should return club members via memberships', async () => {
      mockClubRepo.findOne.mockResolvedValue({ id: 'club-1' });
      mockClubMemberRepo.find.mockResolvedValue([
        {
          user: {
            id: 'user-1',
            email: 'a@b.com',
            emailVerified: true,
            role: 'ADMIN',
            organisation: { id: 'org-1', name: 'Org' },
          },
        },
      ]);

      const result = await service.listUsers('club-1');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('a@b.com');
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.listUsers('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePosition', () => {
    it('should update position on membership', async () => {
      mockClubRepo.findOne.mockResolvedValue({ id: 'club-1', type: 'Touch' });
      mockClubMemberRepo.findOne.mockResolvedValue({ id: 'cm-1', position: null });

      await service.updatePosition('club-1', 'user-1', 'Wing');

      expect(mockClubMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ position: 'Wing' }),
      );
    });

    it('should throw BadRequestException for invalid position', async () => {
      mockClubRepo.findOne.mockResolvedValue({ id: 'club-1', type: 'Touch' });

      await expect(
        service.updatePosition('club-1', 'user-1', 'Goalkeeper'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if club not found', async () => {
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updatePosition('bad', 'user-1', 'Wing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if membership not found', async () => {
      mockClubRepo.findOne.mockResolvedValue({ id: 'club-1', type: 'Touch' });
      mockClubMemberRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updatePosition('club-1', 'user-1', 'Wing'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
