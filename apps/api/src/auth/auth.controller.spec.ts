import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { OrganisationService } from './organisation.service';
import { InviteService } from './invite.service';
import { ClubService } from './club.service';
import { TeamService } from './team.service';
import { LeagueService } from './league.service';
import { EventService } from './event.service';
import { JoinRequestService } from './join-request.service';
import { NotificationService } from './notification.service';
import { HomeContentService } from './home-content.service';

const mockUser = {
  id: 'user-1',
  organisationName: 'Org',
  organisationId: 'org-1',
  email: 'a@b.com',
  emailVerified: false,
  role: 'ADMIN' as const,
  firstName: null,
  lastName: null,
  phone: null,
  avatarUrl: null,
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
  getUserClubsWithTeams: vi.fn().mockResolvedValue([
    {
      id: 'club-1', name: 'Club', type: 'Touch', organisationId: 'org-1',
      teams: [{ id: 'team-1', name: 'Team', clubId: 'club-1' }],
    },
  ]),
  getUserClubMemberships: vi.fn().mockResolvedValue([
    { clubId: 'club-1', clubName: 'Club', clubType: 'Touch', position: 'Wing' },
  ]),
  updateProfile: vi.fn().mockResolvedValue({
    ...mockUser, firstName: 'John', lastName: 'Doe', phone: '555-1234',
  }),
  removeAvatar: vi.fn().mockResolvedValue({ ...mockUser, avatarUrl: null }),
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

const mockClubService = {
  create: vi.fn().mockResolvedValue({
    id: 'club-1', name: 'Club', type: 'Touch', organisationId: 'org-1',
  }),
  listByOrganisation: vi.fn().mockResolvedValue([
    { id: 'club-1', name: 'Club', type: 'Touch', organisationId: 'org-1' },
  ]),
  listUsers: vi.fn().mockResolvedValue([mockUser]),
  addUser: vi.fn().mockResolvedValue(undefined),
  removeUser: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue({
    id: 'club-1', name: 'Updated Club', type: 'Soccer', organisationId: 'org-1',
  }),
  updatePosition: vi.fn().mockResolvedValue(undefined),
};

const mockTeamService = {
  create: vi.fn().mockResolvedValue({ id: 'team-1', name: 'Team', clubId: 'club-1' }),
  listByClub: vi.fn().mockResolvedValue([
    { id: 'team-1', name: 'Team', clubId: 'club-1' },
  ]),
  listUsers: vi.fn().mockResolvedValue([mockUser]),
  addUser: vi.fn().mockResolvedValue(undefined),
  removeUser: vi.fn().mockResolvedValue(undefined),
};

const mockLeagueService = {
  create: vi.fn().mockResolvedValue({
    id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null,
  }),
  listByOrganisation: vi.fn().mockResolvedValue([
    { id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null },
  ]),
  getDetail: vi.fn().mockResolvedValue({
    league: { id: 'league-1', name: 'Spring League', type: 'club', organisationId: 'org-1', clubId: null },
    fixtures: [],
    standings: [],
    topScorers: [],
  }),
  deleteLeague: vi.fn().mockResolvedValue(undefined),
  createFixture: vi.fn().mockResolvedValue({
    id: 'fixture-1', leagueId: 'league-1',
    homeId: 'club-1', awayId: 'club-2',
    homeName: 'Club A', awayName: 'Club B',
    date: null, homeScore: null, awayScore: null, status: 'scheduled',
  }),
  updateFixture: vi.fn().mockResolvedValue({
    id: 'fixture-1', leagueId: 'league-1',
    homeId: 'club-1', awayId: 'club-2',
    homeName: 'Club A', awayName: 'Club B',
    date: null, homeScore: 2, awayScore: 1, status: 'completed',
  }),
  deleteFixture: vi.fn().mockResolvedValue(undefined),
  createGoal: vi.fn().mockResolvedValue({
    id: 'goal-1', fixtureId: 'fixture-1', scorerId: 'user-1', scorerName: 'John Doe',
  }),
  deleteGoal: vi.fn().mockResolvedValue(undefined),
};

const mockEventService = {
  create: vi.fn().mockResolvedValue({
    id: 'event-1', title: 'Training', date: '2026-03-10',
    startTime: '18:00', endTime: '19:30', allDay: false,
    primaryContact: null, secondaryContact: null, hostedByName: 'My Club',
    location: 'Main Pitch', description: null, organisationId: 'org-1',
    createdAt: '2026-03-01T00:00:00.000Z',
  }),
  listByOrganisation: vi.fn().mockResolvedValue([{
    id: 'event-1', title: 'Training', date: '2026-03-10',
    startTime: '18:00', endTime: '19:30', allDay: false,
    primaryContact: null, secondaryContact: null, hostedByName: 'My Club',
    location: 'Main Pitch', description: null, organisationId: 'org-1',
    createdAt: '2026-03-01T00:00:00.000Z',
  }]),
  update: vi.fn().mockResolvedValue({
    id: 'event-1', title: 'Updated Training', date: '2026-03-10',
    startTime: '18:00', endTime: '19:30', allDay: false,
    primaryContact: null, secondaryContact: null, hostedByName: 'My Club',
    location: 'Main Pitch', description: null, organisationId: 'org-1',
    createdAt: '2026-03-01T00:00:00.000Z',
  }),
  delete: vi.fn().mockResolvedValue(undefined),
};

const mockJoinRequestService = {
  create: vi.fn().mockResolvedValue({ id: 'jr-1', status: 'pending' }),
  listMyRequests: vi.fn().mockResolvedValue([]),
  listPendingForOrganisation: vi.fn().mockResolvedValue([]),
  respond: vi.fn().mockResolvedValue({ id: 'jr-1', status: 'approved' }),
};

const mockNotificationService = {
  listUnread: vi.fn().mockResolvedValue([]),
  countUnread: vi.fn().mockResolvedValue(0),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAllAsRead: vi.fn().mockResolvedValue(undefined),
};

const mockHomeContentService = {
  getHomeContent: vi.fn().mockResolvedValue({ message: 'Welcome', images: [] }),
  updateMessage: vi.fn().mockResolvedValue({ success: true }),
  addImage: vi.fn().mockResolvedValue({ id: 'img-1', url: 'https://example.com/img.jpg', sortOrder: 0 }),
  deleteImage: vi.fn().mockResolvedValue(undefined),
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
        { provide: ClubService, useValue: mockClubService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: LeagueService, useValue: mockLeagueService },
        { provide: EventService, useValue: mockEventService },
        { provide: JoinRequestService, useValue: mockJoinRequestService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: HomeContentService, useValue: mockHomeContentService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('signup', () => {
    it('should create user with club type, set cookie, and return user', async () => {
      const result = await controller.signup(
        {
          organisationName: 'Org',
          clubName: 'Club',
          clubType: 'Touch',
          teamName: 'Team',
          email: 'a@b.com',
          password: 'password123',
        },
        res as any,
      );

      expect(result).toEqual({ user: mockUser });
      expect(res.cookie).toHaveBeenCalled();
      expect(mockAuthService.signup).toHaveBeenCalledWith(
        'Org', 'a@b.com', 'password123', 'Club', 'Touch', 'Team',
      );
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

  describe('getMyClubs', () => {
    it('should return clubs with teams for the current user', async () => {
      const result = await controller.getMyClubs({ id: 'user-1', role: 'USER' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Club');
      expect(result[0].teams).toHaveLength(1);
      expect(mockUserService.getUserClubsWithTeams).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getMyMemberships', () => {
    it('should return club memberships with positions', async () => {
      const result = await controller.getMyMemberships({ id: 'user-1', role: 'USER' });

      expect(result).toHaveLength(1);
      expect(result[0].clubName).toBe('Club');
      expect(result[0].position).toBe('Wing');
      expect(mockUserService.getUserClubMemberships).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateMyPosition', () => {
    it('should update position and return success', async () => {
      const result = await controller.updateMyPosition(
        { id: 'user-1', role: 'USER' },
        'club-1',
        { position: 'Wing' },
      );

      expect(result).toEqual({ success: true });
      expect(mockClubService.updatePosition).toHaveBeenCalledWith('club-1', 'user-1', 'Wing');
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

  describe('createClub', () => {
    it('should create a club with type in the user org', async () => {
      const result = await controller.createClub(
        { name: 'New Club', type: 'Touch' },
        { id: 'user-1', role: 'ADMIN' },
      );

      expect(result).toEqual({ id: 'club-1', name: 'Club', type: 'Touch', organisationId: 'org-1' });
      expect(mockClubService.create).toHaveBeenCalledWith('New Club', 'Touch', 'org-1');
    });
  });

  describe('listClubs', () => {
    it('should return clubs for user org', async () => {
      const result = await controller.listClubs({ id: 'user-1', role: 'ADMIN' });

      expect(result).toHaveLength(1);
      expect(mockClubService.listByOrganisation).toHaveBeenCalledWith('org-1');
    });
  });

  describe('listClubUsers', () => {
    it('should return club members', async () => {
      const result = await controller.listClubUsers('club-1');

      expect(result).toEqual([mockUser]);
      expect(mockClubService.listUsers).toHaveBeenCalledWith('club-1');
    });
  });

  describe('addUserToClub', () => {
    it('should add user to club', async () => {
      const result = await controller.addUserToClub('club-1', { userId: 'user-1' });

      expect(result).toEqual({ success: true });
      expect(mockClubService.addUser).toHaveBeenCalledWith('club-1', 'user-1');
    });
  });

  describe('removeUserFromClub', () => {
    it('should remove user from club', async () => {
      const result = await controller.removeUserFromClub('club-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockClubService.removeUser).toHaveBeenCalledWith('club-1', 'user-1');
    });
  });

  describe('updateClub', () => {
    it('should update club name and type', async () => {
      const result = await controller.updateClub('club-1', { name: 'Updated Club', type: 'Soccer' });

      expect(result.name).toBe('Updated Club');
      expect(result.type).toBe('Soccer');
      expect(mockClubService.update).toHaveBeenCalledWith('club-1', 'Updated Club', 'Soccer');
    });
  });

  describe('createTeam', () => {
    it('should create a team', async () => {
      const result = await controller.createTeam({ name: 'New Team', clubId: 'club-1' });

      expect(result).toEqual({ id: 'team-1', name: 'Team', clubId: 'club-1' });
      expect(mockTeamService.create).toHaveBeenCalledWith('New Team', 'club-1');
    });
  });

  describe('listTeams', () => {
    it('should return teams for club', async () => {
      const result = await controller.listTeams('club-1');

      expect(result).toHaveLength(1);
      expect(mockTeamService.listByClub).toHaveBeenCalledWith('club-1');
    });
  });

  describe('listTeamUsers', () => {
    it('should return team members', async () => {
      const result = await controller.listTeamUsers('team-1');

      expect(result).toEqual([mockUser]);
      expect(mockTeamService.listUsers).toHaveBeenCalledWith('team-1');
    });
  });

  describe('addUserToTeam', () => {
    it('should add user to team', async () => {
      const result = await controller.addUserToTeam('team-1', { userId: 'user-1' });

      expect(result).toEqual({ success: true });
      expect(mockTeamService.addUser).toHaveBeenCalledWith('team-1', 'user-1');
    });
  });

  describe('removeUserFromTeam', () => {
    it('should remove user from team', async () => {
      const result = await controller.removeUserFromTeam('team-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockTeamService.removeUser).toHaveBeenCalledWith('team-1', 'user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      const result = await controller.updateProfile(
        { id: 'user-1', role: 'ADMIN' },
        { firstName: 'John', lastName: 'Doe', phone: '555-1234' },
      );

      expect(result.firstName).toBe('John');
      expect(mockUserService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        { firstName: 'John', lastName: 'Doe', phone: '555-1234' },
        undefined,
      );
    });

    it('should pass avatar file to service', async () => {
      const fakeFile = { filename: 'abc.jpg' } as Express.Multer.File;
      await controller.updateProfile(
        { id: 'user-1', role: 'ADMIN' },
        { firstName: 'Jane' },
        fakeFile,
      );

      expect(mockUserService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        { firstName: 'Jane' },
        fakeFile,
      );
    });
  });

  describe('removeAvatar', () => {
    it('should remove avatar and return user', async () => {
      const result = await controller.removeAvatar({ id: 'user-1', role: 'ADMIN' });

      expect(result.avatarUrl).toBeNull();
      expect(mockUserService.removeAvatar).toHaveBeenCalledWith('user-1');
    });
  });

  describe('listLeagues', () => {
    it('should return leagues for user org', async () => {
      const result = await controller.listLeagues({ id: 'user-1', role: 'ADMIN' });

      expect(result).toHaveLength(1);
      expect(mockLeagueService.listByOrganisation).toHaveBeenCalledWith('org-1', false);
    });

    it('should pass includeArchived=true when query param is set', async () => {
      await controller.listLeagues({ id: 'user-1', role: 'ADMIN' }, 'true');

      expect(mockLeagueService.listByOrganisation).toHaveBeenCalledWith('org-1', true);
    });
  });

  describe('getLeagueDetail', () => {
    it('should return league detail', async () => {
      const result = await controller.getLeagueDetail('league-1');

      expect(result.league.name).toBe('Spring League');
      expect(mockLeagueService.getDetail).toHaveBeenCalledWith('league-1');
    });
  });

  describe('createLeague', () => {
    it('should create a league in the user org', async () => {
      const result = await controller.createLeague(
        { name: 'Spring League', type: 'club' },
        { id: 'user-1', role: 'ADMIN' },
      );

      expect(result.id).toBe('league-1');
      expect(mockLeagueService.create).toHaveBeenCalledWith(
        'Spring League', 'club', 'org-1', undefined,
      );
    });
  });

  describe('deleteLeague', () => {
    it('should delete a league', async () => {
      const result = await controller.deleteLeague('league-1');

      expect(result).toEqual({ success: true });
      expect(mockLeagueService.deleteLeague).toHaveBeenCalledWith('league-1');
    });
  });

  describe('createFixture', () => {
    it('should create a fixture', async () => {
      const result = await controller.createFixture('league-1', {
        homeId: 'club-1', awayId: 'club-2',
      });

      expect(result.homeId).toBe('club-1');
      expect(mockLeagueService.createFixture).toHaveBeenCalledWith(
        'league-1', 'club-1', 'club-2', undefined,
      );
    });
  });

  describe('updateFixture', () => {
    it('should update a fixture', async () => {
      const result = await controller.updateFixture('fixture-1', {
        homeScore: 2, awayScore: 1, status: 'completed',
      });

      expect(result.homeScore).toBe(2);
      expect(mockLeagueService.updateFixture).toHaveBeenCalledWith('fixture-1', {
        homeScore: 2, awayScore: 1, status: 'completed',
      });
    });
  });

  describe('deleteFixture', () => {
    it('should delete a fixture', async () => {
      const result = await controller.deleteFixture('fixture-1');

      expect(result).toEqual({ success: true });
      expect(mockLeagueService.deleteFixture).toHaveBeenCalledWith('fixture-1');
    });
  });

  describe('createGoal', () => {
    it('should create a goal', async () => {
      const result = await controller.createGoal('fixture-1', { scorerId: 'user-1' });

      expect(result.scorerName).toBe('John Doe');
      expect(mockLeagueService.createGoal).toHaveBeenCalledWith('fixture-1', 'user-1');
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal', async () => {
      const result = await controller.deleteGoal('goal-1');

      expect(result).toEqual({ success: true });
      expect(mockLeagueService.deleteGoal).toHaveBeenCalledWith('goal-1');
    });
  });

  describe('createEvent', () => {
    it('should create an event in the user org', async () => {
      const result = await controller.createEvent(
        { title: 'Training', date: '2026-03-10', hostedByName: 'My Club' } as any,
        { id: 'user-1', role: 'ADMIN' },
      );

      expect(result.title).toBe('Training');
      expect(mockEventService.create).toHaveBeenCalledWith(
        'org-1',
        { title: 'Training', date: '2026-03-10', hostedByName: 'My Club' },
      );
    });
  });

  describe('listEvents', () => {
    it('should return events for user org', async () => {
      const result = await controller.listEvents({ id: 'user-1', role: 'ADMIN' });

      expect(result).toHaveLength(1);
      expect(mockEventService.listByOrganisation).toHaveBeenCalledWith('org-1');
    });
  });

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const result = await controller.updateEvent('event-1', { title: 'Updated Training' } as any);

      expect(result.title).toBe('Updated Training');
      expect(mockEventService.update).toHaveBeenCalledWith('event-1', { title: 'Updated Training' });
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const result = await controller.deleteEvent('event-1');

      expect(result).toEqual({ success: true });
      expect(mockEventService.delete).toHaveBeenCalledWith('event-1');
    });
  });
});
