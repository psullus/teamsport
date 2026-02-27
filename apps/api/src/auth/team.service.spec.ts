import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamEntity } from './entities/team.entity';
import { UserEntity } from './entities/user.entity';

const mockTeamRepo = {
  create: vi.fn((data) => ({ ...data, id: 'team-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
};

const mockUserRepo = {
  findOne: vi.fn(),
};

describe('TeamService', () => {
  let service: TeamService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: getRepositoryToken(TeamEntity), useValue: mockTeamRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(TeamService);
  });

  describe('create', () => {
    it('should create a team and return response', async () => {
      mockTeamRepo.create.mockReturnValue({ id: 'team-1', name: 'A Team' });
      mockTeamRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.create('A Team', 'club-1');

      expect(result.id).toBe('team-1');
      expect(result.name).toBe('A Team');
      expect(result.clubId).toBe('club-1');
      expect(mockTeamRepo.save).toHaveBeenCalled();
    });
  });

  describe('listByClub', () => {
    it('should return teams for club', async () => {
      mockTeamRepo.find.mockResolvedValue([
        { id: 'team-1', name: 'Team A', club: { id: 'club-1' } },
        { id: 'team-2', name: 'Team B', club: { id: 'club-1' } },
      ]);

      const result = await service.listByClub('club-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Team A');
    });
  });

  describe('addUser', () => {
    it('should add user to team', async () => {
      const team = { id: 'team-1', members: [] as any[] };
      const user = { id: 'user-1' };
      mockTeamRepo.findOne.mockResolvedValue(team);
      mockUserRepo.findOne.mockResolvedValue(user);

      await service.addUser('team-1', 'user-1');

      expect(team.members).toContain(user);
      expect(mockTeamRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if team not found', async () => {
      mockTeamRepo.findOne.mockResolvedValue(null);

      await expect(service.addUser('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockTeamRepo.findOne.mockResolvedValue({ id: 'team-1', members: [] });
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.addUser('team-1', 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUser', () => {
    it('should remove user from team', async () => {
      const team = { id: 'team-1', members: [{ id: 'user-1' }, { id: 'user-2' }] };
      mockTeamRepo.findOne.mockResolvedValue(team);

      await service.removeUser('team-1', 'user-1');

      expect(team.members).toHaveLength(1);
      expect(team.members[0].id).toBe('user-2');
    });
  });

  describe('rename', () => {
    it('should rename a team', async () => {
      const team = { id: 'team-1', name: 'Old Name', club: { id: 'club-1' } };
      mockTeamRepo.findOne.mockResolvedValue(team);
      mockTeamRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.rename('team-1', 'New Name');

      expect(result.name).toBe('New Name');
      expect(mockTeamRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if team not found', async () => {
      mockTeamRepo.findOne.mockResolvedValue(null);

      await expect(service.rename('bad', 'Name')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a team', async () => {
      const team = { id: 'team-1' };
      mockTeamRepo.findOne.mockResolvedValue(team);

      await service.delete('team-1');

      expect(mockTeamRepo.remove).toHaveBeenCalledWith(team);
    });

    it('should throw NotFoundException if team not found', async () => {
      mockTeamRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUsers', () => {
    it('should return team members', async () => {
      mockTeamRepo.findOne.mockResolvedValue({
        id: 'team-1',
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

      const result = await service.listUsers('team-1');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('a@b.com');
    });

    it('should throw NotFoundException if team not found', async () => {
      mockTeamRepo.findOne.mockResolvedValue(null);

      await expect(service.listUsers('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
