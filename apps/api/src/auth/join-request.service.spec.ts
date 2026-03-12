import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JoinRequestService } from './join-request.service';
import { JoinRequestEntity } from './entities/join-request.entity';
import { ClubEntity } from './entities/club.entity';
import { TeamEntity } from './entities/team.entity';
import { UserEntity } from './entities/user.entity';
import { ClubService } from './club.service';
import { TeamService } from './team.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';

const mockJoinRequestRepo = {
  create: vi.fn((data) => ({ ...data, id: 'jr-1', status: 'pending', createdAt: new Date() })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
};

const mockClubRepo = {
  findOne: vi.fn(),
};

const mockTeamRepo = {
  findOne: vi.fn(),
};

const mockUserRepo = {
  findOne: vi.fn(),
  find: vi.fn(),
};

const mockClubService = {
  addUser: vi.fn(),
};

const mockTeamService = {
  addUser: vi.fn(),
};

const mockNotificationService = {
  create: vi.fn(),
};

const mockEmailService = {
  sendJoinRequestEmail: vi.fn(),
};

const testUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  organisation: { id: 'org-1', name: 'Test Org' },
};

const testClub = {
  id: 'club-1',
  name: 'Test Club',
  organisation: { id: 'org-1' },
};

const testTeam = {
  id: 'team-1',
  name: 'Test Team',
  club: { id: 'club-1', organisation: { id: 'org-1' } },
};

describe('JoinRequestService', () => {
  let service: JoinRequestService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        JoinRequestService,
        { provide: getRepositoryToken(JoinRequestEntity), useValue: mockJoinRequestRepo },
        { provide: getRepositoryToken(ClubEntity), useValue: mockClubRepo },
        { provide: getRepositoryToken(TeamEntity), useValue: mockTeamRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: ClubService, useValue: mockClubService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get(JoinRequestService);
  });

  describe('create', () => {
    it('should create a join request for a club', async () => {
      mockUserRepo.findOne.mockResolvedValue(testUser);
      mockClubRepo.findOne.mockResolvedValue(testClub);
      mockJoinRequestRepo.findOne.mockResolvedValue(null);
      mockUserRepo.find.mockResolvedValue([
        { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
      ]);

      const result = await service.create('user-1', 'club', 'club-1');

      expect(result.targetType).toBe('club');
      expect(result.targetName).toBe('Test Club');
      expect(result.status).toBe('pending');
      expect(mockJoinRequestRepo.save).toHaveBeenCalled();
      expect(mockNotificationService.create).toHaveBeenCalled();
      expect(mockEmailService.sendJoinRequestEmail).toHaveBeenCalled();
    });

    it('should create a join request for a team', async () => {
      mockUserRepo.findOne.mockResolvedValue(testUser);
      mockTeamRepo.findOne.mockResolvedValue(testTeam);
      mockJoinRequestRepo.findOne.mockResolvedValue(null);
      mockUserRepo.find.mockResolvedValue([]);

      const result = await service.create('user-1', 'team', 'team-1');

      expect(result.targetType).toBe('team');
      expect(result.targetName).toBe('Test Team');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.create('bad', 'club', 'club-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if club not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(testUser);
      mockClubRepo.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', 'club', 'bad')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if club is in different org', async () => {
      mockUserRepo.findOne.mockResolvedValue(testUser);
      mockClubRepo.findOne.mockResolvedValue({
        ...testClub,
        organisation: { id: 'other-org' },
      });

      await expect(service.create('user-1', 'club', 'club-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if pending request exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(testUser);
      mockClubRepo.findOne.mockResolvedValue(testClub);
      mockJoinRequestRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create('user-1', 'club', 'club-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('respond', () => {
    const pendingRequest = {
      id: 'jr-1',
      status: 'pending',
      targetType: 'club',
      targetId: 'club-1',
      user: testUser,
      createdAt: new Date(),
      respondedAt: null,
    };

    it('should approve a request and add user to club', async () => {
      mockJoinRequestRepo.findOne.mockResolvedValue({ ...pendingRequest });
      mockJoinRequestRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockClubRepo.findOne.mockResolvedValue(testClub);

      const result = await service.respond('jr-1', 'approved');

      expect(result.status).toBe('approved');
      expect(mockClubService.addUser).toHaveBeenCalledWith('club-1', 'user-1');
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('approved'),
        'join_request_approved',
        'jr-1',
      );
    });

    it('should reject a request', async () => {
      mockJoinRequestRepo.findOne.mockResolvedValue({ ...pendingRequest });
      mockJoinRequestRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockClubRepo.findOne.mockResolvedValue(testClub);

      const result = await service.respond('jr-1', 'rejected');

      expect(result.status).toBe('rejected');
      expect(mockClubService.addUser).not.toHaveBeenCalled();
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('rejected'),
        'join_request_rejected',
        'jr-1',
      );
    });

    it('should approve a team request and add user to team', async () => {
      const teamRequest = { ...pendingRequest, targetType: 'team', targetId: 'team-1' };
      mockJoinRequestRepo.findOne.mockResolvedValue({ ...teamRequest });
      mockJoinRequestRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockTeamRepo.findOne.mockResolvedValue(testTeam);

      await service.respond('jr-1', 'approved');

      expect(mockTeamService.addUser).toHaveBeenCalledWith('team-1', 'user-1');
    });

    it('should throw NotFoundException if request not found', async () => {
      mockJoinRequestRepo.findOne.mockResolvedValue(null);

      await expect(service.respond('bad', 'approved')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already responded', async () => {
      mockJoinRequestRepo.findOne.mockResolvedValue({
        ...pendingRequest,
        status: 'approved',
      });

      await expect(service.respond('jr-1', 'approved')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listMyRequests', () => {
    it('should return requests for user', async () => {
      mockJoinRequestRepo.find.mockResolvedValue([
        {
          id: 'jr-1',
          targetType: 'club',
          targetId: 'club-1',
          status: 'pending',
          user: testUser,
          createdAt: new Date(),
          respondedAt: null,
        },
      ]);
      mockClubRepo.findOne.mockResolvedValue(testClub);

      const result = await service.listMyRequests('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].targetName).toBe('Test Club');
    });
  });

  describe('listPendingForOrganisation', () => {
    it('should return pending requests for org', async () => {
      mockJoinRequestRepo.find.mockResolvedValue([
        {
          id: 'jr-1',
          targetType: 'club',
          targetId: 'club-1',
          status: 'pending',
          user: testUser,
          createdAt: new Date(),
          respondedAt: null,
        },
      ]);
      mockClubRepo.findOne.mockResolvedValue(testClub);

      const result = await service.listPendingForOrganisation('org-1');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });
});
