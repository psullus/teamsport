import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { LeagueService } from './league.service';
import { LeagueEntity } from './entities/league.entity';
import { FixtureEntity } from './entities/fixture.entity';
import { GoalEntity } from './entities/goal.entity';
import { ClubEntity } from './entities/club.entity';
import { TeamEntity } from './entities/team.entity';

const mockLeagueRepo = {
  create: vi.fn((data) => ({ ...data, id: 'league-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
};

const mockFixtureRepo = {
  create: vi.fn((data) => ({ ...data, id: 'fixture-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
};

const mockGoalRepo = {
  create: vi.fn((data) => ({ ...data, id: 'goal-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
};

const mockClubRepo = {
  find: vi.fn(),
};

const mockTeamRepo = {
  find: vi.fn(),
};

describe('LeagueService', () => {
  let service: LeagueService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        LeagueService,
        { provide: getRepositoryToken(LeagueEntity), useValue: mockLeagueRepo },
        { provide: getRepositoryToken(FixtureEntity), useValue: mockFixtureRepo },
        { provide: getRepositoryToken(GoalEntity), useValue: mockGoalRepo },
        { provide: getRepositoryToken(ClubEntity), useValue: mockClubRepo },
        { provide: getRepositoryToken(TeamEntity), useValue: mockTeamRepo },
      ],
    }).compile();

    service = module.get(LeagueService);
  });

  describe('create', () => {
    it('should create a club league', async () => {
      mockLeagueRepo.create.mockReturnValue({
        id: 'league-1', name: 'Spring League', type: 'club',
      });
      mockLeagueRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.create('Spring League', 'club', 'org-1');

      expect(result.id).toBe('league-1');
      expect(result.name).toBe('Spring League');
      expect(result.type).toBe('club');
      expect(result.organisationId).toBe('org-1');
      expect(result.clubId).toBeNull();
    });

    it('should create a team league with clubId', async () => {
      mockLeagueRepo.create.mockReturnValue({
        id: 'league-2', name: 'Team League', type: 'team',
      });
      mockLeagueRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.create('Team League', 'team', 'org-1', 'club-1');

      expect(result.type).toBe('team');
      expect(result.clubId).toBe('club-1');
    });
  });

  describe('listByOrganisation', () => {
    it('should return leagues for organisation', async () => {
      mockLeagueRepo.find.mockResolvedValue([
        {
          id: 'league-1', name: 'League A', type: 'club',
          organisation: { id: 'org-1' }, club: null,
        },
      ]);

      const result = await service.listByOrganisation('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('League A');
    });
  });

  describe('getDetail', () => {
    it('should return league detail with standings and top scorers', async () => {
      mockLeagueRepo.findOne.mockResolvedValue({
        id: 'league-1', name: 'League', type: 'club',
        organisation: { id: 'org-1' }, club: null,
      });
      mockFixtureRepo.find.mockResolvedValue([
        {
          id: 'f1', status: 'completed',
          homeClub: { id: 'club-1', name: 'Club A' },
          awayClub: { id: 'club-2', name: 'Club B' },
          homeTeam: null, awayTeam: null,
          league: { id: 'league-1' },
          date: new Date('2026-03-01'), homeScore: 3, awayScore: 1,
        },
      ]);
      mockGoalRepo.find.mockResolvedValue([
        {
          id: 'g1', fixture: { id: 'f1' },
          scorer: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'j@d.com' },
        },
      ]);

      const result = await service.getDetail('league-1');

      expect(result.league.name).toBe('League');
      expect(result.fixtures).toHaveLength(1);
      expect(result.standings).toHaveLength(2);
      expect(result.standings[0].participantName).toBe('Club A');
      expect(result.standings[0].points).toBe(3);
      expect(result.standings[1].participantName).toBe('Club B');
      expect(result.standings[1].points).toBe(1);
      expect(result.topScorers).toHaveLength(1);
      expect(result.topScorers[0].name).toBe('John Doe');
      expect(result.goals['f1']).toHaveLength(1);
      expect(result.goals['f1'][0].scorerName).toBe('John Doe');
    });

    it('should throw NotFoundException if league not found', async () => {
      mockLeagueRepo.findOne.mockResolvedValue(null);

      await expect(service.getDetail('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteLeague', () => {
    it('should delete a league', async () => {
      mockLeagueRepo.findOne.mockResolvedValue({ id: 'league-1' });

      await service.deleteLeague('league-1');

      expect(mockLeagueRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if league not found', async () => {
      mockLeagueRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteLeague('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFixture', () => {
    it('should create a fixture for a club league', async () => {
      mockLeagueRepo.findOne.mockResolvedValue({
        id: 'league-1', type: 'club',
        organisation: { id: 'org-1' }, club: null,
      });
      mockFixtureRepo.create.mockReturnValue({ id: 'fixture-1' });
      mockFixtureRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockFixtureRepo.findOne.mockResolvedValue({
        id: 'fixture-1', league: { id: 'league-1' },
        homeClub: { id: 'club-1', name: 'Club A' },
        awayClub: { id: 'club-2', name: 'Club B' },
        homeTeam: null, awayTeam: null,
        date: null, homeScore: null, awayScore: null, status: 'scheduled',
      });

      const result = await service.createFixture('league-1', 'club-1', 'club-2');

      expect(result.homeId).toBe('club-1');
      expect(result.awayId).toBe('club-2');
      expect(result.status).toBe('scheduled');
    });

    it('should throw NotFoundException if league not found', async () => {
      mockLeagueRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createFixture('bad', 'h', 'a'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFixture', () => {
    it('should update fixture fields', async () => {
      mockFixtureRepo.findOne.mockResolvedValue({
        id: 'fixture-1', league: { id: 'league-1' },
        homeClub: { id: 'club-1', name: 'A' },
        awayClub: { id: 'club-2', name: 'B' },
        homeTeam: null, awayTeam: null,
        date: null, homeScore: null, awayScore: null, status: 'scheduled',
      });
      mockFixtureRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.updateFixture('fixture-1', {
        homeScore: 2, awayScore: 1, status: 'completed',
      });

      expect(result.homeScore).toBe(2);
      expect(result.awayScore).toBe(1);
      expect(result.status).toBe('completed');
    });

    it('should throw NotFoundException if fixture not found', async () => {
      mockFixtureRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateFixture('bad', { status: 'completed' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFixture', () => {
    it('should delete a fixture', async () => {
      mockFixtureRepo.findOne.mockResolvedValue({ id: 'fixture-1' });

      await service.deleteFixture('fixture-1');

      expect(mockFixtureRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if fixture not found', async () => {
      mockFixtureRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteFixture('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGoal', () => {
    it('should create a goal', async () => {
      mockFixtureRepo.findOne.mockResolvedValue({ id: 'fixture-1' });
      mockGoalRepo.create.mockReturnValue({ id: 'goal-1' });
      mockGoalRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockGoalRepo.findOne.mockResolvedValue({
        id: 'goal-1', fixture: { id: 'fixture-1' },
        scorer: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'j@d.com' },
      });

      const result = await service.createGoal('fixture-1', 'u1');

      expect(result.scorerName).toBe('John Doe');
      expect(result.fixtureId).toBe('fixture-1');
    });

    it('should throw NotFoundException if fixture not found', async () => {
      mockFixtureRepo.findOne.mockResolvedValue(null);

      await expect(service.createGoal('bad', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal', async () => {
      mockGoalRepo.findOne.mockResolvedValue({ id: 'goal-1' });

      await service.deleteGoal('goal-1');

      expect(mockGoalRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if goal not found', async () => {
      mockGoalRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteGoal('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateRoundRobin', () => {
    it('should generate all pairings for a club league', async () => {
      mockLeagueRepo.findOne.mockResolvedValue({
        id: 'league-1', type: 'club',
        organisation: { id: 'org-1' }, club: null,
      });
      mockClubRepo.find.mockResolvedValue([
        { id: 'c1' }, { id: 'c2' }, { id: 'c3' },
      ]);
      let createCount = 0;
      mockFixtureRepo.create.mockImplementation((data) => ({
        ...data, id: `fix-${++createCount}`,
      }));
      mockFixtureRepo.save.mockImplementation((entities) => Promise.resolve(entities));
      mockFixtureRepo.find.mockResolvedValue([
        {
          id: 'fix-1', league: { id: 'league-1' },
          homeClub: { id: 'c1', name: 'C1' }, awayClub: { id: 'c2', name: 'C2' },
          homeTeam: null, awayTeam: null,
          date: null, homeScore: null, awayScore: null, status: 'scheduled',
        },
        {
          id: 'fix-2', league: { id: 'league-1' },
          homeClub: { id: 'c1', name: 'C1' }, awayClub: { id: 'c3', name: 'C3' },
          homeTeam: null, awayTeam: null,
          date: null, homeScore: null, awayScore: null, status: 'scheduled',
        },
        {
          id: 'fix-3', league: { id: 'league-1' },
          homeClub: { id: 'c2', name: 'C2' }, awayClub: { id: 'c3', name: 'C3' },
          homeTeam: null, awayTeam: null,
          date: null, homeScore: null, awayScore: null, status: 'scheduled',
        },
      ]);

      const result = await service.generateRoundRobin('league-1');

      expect(result).toHaveLength(3);
      expect(mockFixtureRepo.save).toHaveBeenCalled();
    });

    it('should generate all pairings for a team league', async () => {
      mockLeagueRepo.findOne.mockResolvedValue({
        id: 'league-2', type: 'team',
        organisation: { id: 'org-1' }, club: { id: 'club-1' },
      });
      mockTeamRepo.find.mockResolvedValue([
        { id: 't1' }, { id: 't2' },
      ]);
      mockFixtureRepo.create.mockImplementation((data) => ({ ...data, id: 'fix-1' }));
      mockFixtureRepo.save.mockImplementation((entities) => Promise.resolve(entities));
      mockFixtureRepo.find.mockResolvedValue([
        {
          id: 'fix-1', league: { id: 'league-2' },
          homeClub: null, awayClub: null,
          homeTeam: { id: 't1', name: 'T1' }, awayTeam: { id: 't2', name: 'T2' },
          date: null, homeScore: null, awayScore: null, status: 'scheduled',
        },
      ]);

      const result = await service.generateRoundRobin('league-2');

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if league not found', async () => {
      mockLeagueRepo.findOne.mockResolvedValue(null);

      await expect(service.generateRoundRobin('bad')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if fewer than 2 participants', async () => {
      mockLeagueRepo.findOne.mockResolvedValue({
        id: 'league-1', type: 'club',
        organisation: { id: 'org-1' }, club: null,
      });
      mockClubRepo.find.mockResolvedValue([{ id: 'c1' }]);

      await expect(service.generateRoundRobin('league-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('computeStandings', () => {
    it('should compute standings with correct points (win=3, draw=2, loss=1, no-show=0)', () => {
      const fixtures = [
        {
          status: 'completed',
          homeClub: { id: 'c1', name: 'Club 1' },
          awayClub: { id: 'c2', name: 'Club 2' },
          homeTeam: null, awayTeam: null,
          homeScore: 2, awayScore: 1,
        },
        {
          status: 'completed',
          homeClub: { id: 'c1', name: 'Club 1' },
          awayClub: { id: 'c3', name: 'Club 3' },
          homeTeam: null, awayTeam: null,
          homeScore: 1, awayScore: 1,
        },
        {
          status: 'no_show_away',
          homeClub: { id: 'c2', name: 'Club 2' },
          awayClub: { id: 'c3', name: 'Club 3' },
          homeTeam: null, awayTeam: null,
          homeScore: 0, awayScore: 0,
        },
      ] as any[];

      const standings = service.computeStandings(fixtures, 'club');

      expect(standings).toHaveLength(3);
      // Club 1: win (3) + draw (2) = 5
      const c1 = standings.find((s) => s.participantId === 'c1')!;
      expect(c1.points).toBe(5);
      expect(c1.won).toBe(1);
      expect(c1.drawn).toBe(1);
      // Club 2: loss (1) + win (3, no-show opponent) = 4
      const c2 = standings.find((s) => s.participantId === 'c2')!;
      expect(c2.points).toBe(4);
      // Club 3: loss (1) + draw (2) + no-show (0) => actually: loss=1 from 2nd game, no_show=0 from 3rd
      // Second fixture: c1 1 - c3 1 => draw => c3 gets 2
      // Third fixture: no_show_away => c3 is away => c3 gets 0, c2 gets 3 (win)
      const c3 = standings.find((s) => s.participantId === 'c3')!;
      expect(c3.points).toBe(2);
      expect(c3.noShows).toBe(1);
    });

    it('should skip scheduled fixtures', () => {
      const fixtures = [
        {
          status: 'scheduled',
          homeClub: { id: 'c1', name: 'Club 1' },
          awayClub: { id: 'c2', name: 'Club 2' },
          homeTeam: null, awayTeam: null,
          homeScore: null, awayScore: null,
        },
      ] as any[];

      const standings = service.computeStandings(fixtures, 'club');

      expect(standings).toHaveLength(0);
    });

    it('should handle team leagues', () => {
      const fixtures = [
        {
          status: 'completed',
          homeClub: null, awayClub: null,
          homeTeam: { id: 't1', name: 'Team 1' },
          awayTeam: { id: 't2', name: 'Team 2' },
          homeScore: 0, awayScore: 2,
        },
      ] as any[];

      const standings = service.computeStandings(fixtures, 'team');

      expect(standings).toHaveLength(2);
      const t2 = standings.find((s) => s.participantId === 't2')!;
      expect(t2.points).toBe(3);
      expect(t2.won).toBe(1);
      const t1 = standings.find((s) => s.participantId === 't1')!;
      expect(t1.points).toBe(1);
      expect(t1.lost).toBe(1);
    });
  });

  describe('computeTopScorers', () => {
    const fixtures = [
      {
        id: 'f1',
        homeClub: { id: 'c1', name: 'Club 1' },
        awayClub: { id: 'c2', name: 'Club 2' },
        homeTeam: null, awayTeam: null,
      },
      {
        id: 'f2',
        homeClub: { id: 'c1', name: 'Club 1' },
        awayClub: { id: 'c3', name: 'Club 3' },
        homeTeam: null, awayTeam: null,
      },
    ] as any[];

    it('should aggregate goals by scorer and sort by count', () => {
      const goals = [
        { fixture: { id: 'f1' }, scorer: { id: 'u1', firstName: 'Alice', lastName: 'A', email: 'a@a.com' } },
        { fixture: { id: 'f2' }, scorer: { id: 'u1', firstName: 'Alice', lastName: 'A', email: 'a@a.com' } },
        { fixture: { id: 'f1' }, scorer: { id: 'u2', firstName: 'Bob', lastName: 'B', email: 'b@b.com' } },
      ] as any[];

      const result = service.computeTopScorers(goals, fixtures, 'club');

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('u1');
      expect(result[0].goals).toBe(2);
      expect(result[0].fixtures).toHaveLength(2);
      expect(result[0].fixtures[0].matchLabel).toBe('Club 1 v Club 2');
      expect(result[0].fixtures[0].goals).toBe(1);
      expect(result[0].fixtures[1].matchLabel).toBe('Club 1 v Club 3');
      expect(result[1].userId).toBe('u2');
      expect(result[1].goals).toBe(1);
      expect(result[1].fixtures).toHaveLength(1);
    });

    it('should use email as name fallback', () => {
      const goals = [
        { fixture: { id: 'f1' }, scorer: { id: 'u1', firstName: null, lastName: null, email: 'a@a.com' } },
      ] as any[];

      const result = service.computeTopScorers(goals, fixtures, 'club');

      expect(result[0].name).toBe('a@a.com');
    });

    it('should group multiple goals in the same fixture', () => {
      const goals = [
        { fixture: { id: 'f1' }, scorer: { id: 'u1', firstName: 'Alice', lastName: 'A', email: 'a@a.com' } },
        { fixture: { id: 'f1' }, scorer: { id: 'u1', firstName: 'Alice', lastName: 'A', email: 'a@a.com' } },
      ] as any[];

      const result = service.computeTopScorers(goals, fixtures, 'club');

      expect(result[0].goals).toBe(2);
      expect(result[0].fixtures).toHaveLength(1);
      expect(result[0].fixtures[0].goals).toBe(2);
    });
  });
});
