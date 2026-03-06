import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import type {
  League,
  Team,
  Fixture,
  Goal,
  StandingsRow,
  TopScorer,
  ScorerFixture,
  LeagueDetail,
  FixtureStatus,
} from '@teamsport/shared';
import { LeagueEntity } from './entities/league.entity';
import { FixtureEntity } from './entities/fixture.entity';
import { GoalEntity } from './entities/goal.entity';
import { ClubEntity } from './entities/club.entity';
import { TeamEntity } from './entities/team.entity';

function toLeagueResponse(league: LeagueEntity): League {
  return {
    id: league.id,
    name: league.name,
    type: league.type,
    organisationId: (league.organisation as any)?.id ?? '',
    clubId: (league.club as any)?.id ?? null,
    started: league.started ?? false,
    archived: league.archived ?? false,
  };
}

function toFixtureResponse(fixture: FixtureEntity): Fixture {
  const isClub = !!(fixture.homeClub || fixture.awayClub);
  return {
    id: fixture.id,
    leagueId: (fixture.league as any)?.id ?? '',
    homeId: isClub
      ? (fixture.homeClub as any)?.id ?? ''
      : (fixture.homeTeam as any)?.id ?? '',
    awayId: isClub
      ? (fixture.awayClub as any)?.id ?? ''
      : (fixture.awayTeam as any)?.id ?? '',
    homeName: isClub
      ? (fixture.homeClub as any)?.name ?? ''
      : (fixture.homeTeam as any)?.name ?? '',
    awayName: isClub
      ? (fixture.awayClub as any)?.name ?? ''
      : (fixture.awayTeam as any)?.name ?? '',
    date: fixture.date ? fixture.date.toISOString() : null,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    status: fixture.status,
  };
}

function toGoalResponse(goal: GoalEntity): Goal {
  const scorer = goal.scorer as any;
  const parts = [scorer?.firstName, scorer?.lastName].filter(Boolean);
  return {
    id: goal.id,
    fixtureId: (goal.fixture as any)?.id ?? '',
    scorerId: scorer?.id ?? '',
    scorerName: parts.length > 0 ? parts.join(' ') : scorer?.email ?? '',
  };
}

@Injectable()
export class LeagueService {
  constructor(
    @InjectRepository(LeagueEntity)
    private leagueRepo: Repository<LeagueEntity>,
    @InjectRepository(FixtureEntity)
    private fixtureRepo: Repository<FixtureEntity>,
    @InjectRepository(GoalEntity)
    private goalRepo: Repository<GoalEntity>,
    @InjectRepository(ClubEntity)
    private clubRepo: Repository<ClubEntity>,
    @InjectRepository(TeamEntity)
    private teamRepo: Repository<TeamEntity>,
  ) {}

  async create(
    name: string,
    type: 'club' | 'team',
    organisationId: string,
    clubId?: string,
  ): Promise<League> {
    const league = this.leagueRepo.create({
      name,
      type,
      organisation: { id: organisationId } as any,
      club: clubId ? ({ id: clubId } as any) : null,
    });
    const saved = await this.leagueRepo.save(league);
    (saved as any).organisation = { id: organisationId };
    (saved as any).club = clubId ? { id: clubId } : null;
    return toLeagueResponse(saved);
  }

  async listByOrganisation(
    organisationId: string,
    includeArchived = false,
  ): Promise<League[]> {
    const leagues = await this.leagueRepo.find({
      where: { organisation: { id: organisationId } },
      relations: ['organisation', 'club'],
    });
    if (includeArchived) {
      return leagues.map(toLeagueResponse);
    }
    return leagues.filter((l) => !l.archived).map(toLeagueResponse);
  }

  async archiveLeague(leagueId: string, archived: boolean): Promise<League> {
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['organisation', 'club'],
    });
    if (!league) throw new NotFoundException('League not found');
    league.archived = archived;
    await this.leagueRepo.save(league);
    return toLeagueResponse(league);
  }

  async getDetail(leagueId: string): Promise<LeagueDetail> {
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['organisation', 'club', 'participants', 'participants.club'],
    });
    if (!league) throw new NotFoundException('League not found');

    const fixtures = await this.fixtureRepo.find({
      where: { league: { id: leagueId } },
      relations: ['league', 'homeClub', 'awayClub', 'homeTeam', 'awayTeam'],
      order: { date: 'ASC' },
    });

    const goals = await this.goalRepo.find({
      where: { fixture: { league: { id: leagueId } } },
      relations: ['fixture', 'scorer'],
    });

    const standings = this.computeStandings(fixtures, league.type);
    const topScorers = this.computeTopScorers(goals, fixtures, league.type);

    const goalsByFixture: Record<string, Goal[]> = {};
    for (const g of goals) {
      const fid = (g.fixture as any)?.id;
      if (!fid) continue;
      if (!goalsByFixture[fid]) goalsByFixture[fid] = [];
      goalsByFixture[fid].push(toGoalResponse(g));
    }

    const participants: Team[] = (league.participants ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      clubId: (t.club as any)?.id ?? '',
    }));

    return {
      league: toLeagueResponse(league),
      participants,
      fixtures: fixtures.map(toFixtureResponse),
      goals: goalsByFixture,
      standings,
      topScorers,
    };
  }

  async listParticipants(leagueId: string): Promise<Team[]> {
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['participants', 'participants.club'],
    });
    if (!league) throw new NotFoundException('League not found');
    return (league.participants ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      clubId: (t.club as any)?.id ?? '',
    }));
  }

  async addParticipant(leagueId: string, teamId: string): Promise<void> {
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['participants'],
    });
    if (!league) throw new NotFoundException('League not found');
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    const already = league.participants.some((p) => p.id === teamId);
    if (!already) {
      league.participants.push(team);
      await this.leagueRepo.save(league);
    }
  }

  async removeParticipant(leagueId: string, teamId: string): Promise<void> {
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['participants'],
    });
    if (!league) throw new NotFoundException('League not found');
    league.participants = league.participants.filter((p) => p.id !== teamId);
    await this.leagueRepo.save(league);
  }

  async deleteLeague(leagueId: string): Promise<void> {
    const league = await this.leagueRepo.findOne({ where: { id: leagueId } });
    if (!league) throw new NotFoundException('League not found');
    await this.leagueRepo.remove(league);
  }

  async createFixture(
    leagueId: string,
    homeId: string,
    awayId: string,
    date?: string,
  ): Promise<Fixture> {
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['organisation', 'club'],
    });
    if (!league) throw new NotFoundException('League not found');
    if (homeId === awayId) throw new BadRequestException('A team cannot play itself');

    const fixtureData: Partial<FixtureEntity> = {
      league: { id: leagueId } as any,
      date: date ? new Date(date) : null,
      status: 'scheduled',
    };

    if (league.type === 'club') {
      fixtureData.homeClub = { id: homeId } as any;
      fixtureData.awayClub = { id: awayId } as any;
    } else {
      fixtureData.homeTeam = { id: homeId } as any;
      fixtureData.awayTeam = { id: awayId } as any;
    }

    const fixture = this.fixtureRepo.create(fixtureData);
    const saved = await this.fixtureRepo.save(fixture);

    const full = await this.fixtureRepo.findOne({
      where: { id: saved.id },
      relations: ['league', 'homeClub', 'awayClub', 'homeTeam', 'awayTeam'],
    });
    return toFixtureResponse(full!);
  }

  async updateFixture(
    fixtureId: string,
    updates: {
      date?: string;
      homeScore?: number;
      awayScore?: number;
      status?: FixtureStatus;
    },
  ): Promise<Fixture> {
    const fixture = await this.fixtureRepo.findOne({
      where: { id: fixtureId },
      relations: ['league', 'homeClub', 'awayClub', 'homeTeam', 'awayTeam'],
    });
    if (!fixture) throw new NotFoundException('Fixture not found');

    if (updates.date !== undefined) fixture.date = new Date(updates.date);
    if (updates.homeScore !== undefined) fixture.homeScore = updates.homeScore;
    if (updates.awayScore !== undefined) fixture.awayScore = updates.awayScore;
    if (updates.status !== undefined) fixture.status = updates.status;

    await this.fixtureRepo.save(fixture);
    return toFixtureResponse(fixture);
  }

  async deleteFixture(fixtureId: string): Promise<void> {
    const fixture = await this.fixtureRepo.findOne({ where: { id: fixtureId } });
    if (!fixture) throw new NotFoundException('Fixture not found');
    await this.fixtureRepo.remove(fixture);
  }

  async createGoal(fixtureId: string, scorerId: string): Promise<Goal> {
    const fixture = await this.fixtureRepo.findOne({ where: { id: fixtureId } });
    if (!fixture) throw new NotFoundException('Fixture not found');

    const goal = this.goalRepo.create({
      fixture: { id: fixtureId },
      scorer: { id: scorerId },
    } as Partial<GoalEntity>);
    const saved = await this.goalRepo.save(goal);

    const full = await this.goalRepo.findOne({
      where: { id: saved.id },
      relations: ['fixture', 'scorer'],
    });
    return toGoalResponse(full!);
  }

  async generateRoundRobin(
    leagueId: string,
    options: { days: string[]; timeSlots: string[]; force: boolean },
  ): Promise<Fixture[]> {
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['organisation', 'club', 'participants', 'participants.club'],
    });
    if (!league) throw new NotFoundException('League not found');

    if (league.started && !options.force) {
      throw new BadRequestException('League already started');
    }

    if (options.force) {
      await this.fixtureRepo.delete({ league: { id: leagueId } });
    }

    const participants = league.participants ?? [];
    if (participants.length < 2) {
      throw new BadRequestException('Need at least 2 participants to generate fixtures');
    }

    const pairs: [string, string][] = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        pairs.push([participants[i].id, participants[j].id]);
      }
    }

    const dayNames = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
    ];
    const targetDays = (options.days.length > 0 ? options.days : ['monday'])
      .map((d) => dayNames.indexOf(d.toLowerCase()))
      .filter((d) => d >= 0)
      .sort((a, b) => a - b);
    if (targetDays.length === 0) targetDays.push(1);

    const now = new Date();
    const baseDate = new Date(now);
    baseDate.setHours(0, 0, 0, 0);

    const startDates = targetDays.map((targetDay) => {
      const d = new Date(baseDate);
      const daysUntil = (targetDay - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntil);
      return d;
    });

    const timeSlots = options.timeSlots.length > 0 ? options.timeSlots : ['19:00'];

    const remaining = [...pairs];
    let weekOffset = 0;
    const fixtures: FixtureEntity[] = [];

    while (remaining.length > 0) {
      for (const dayStart of startDates) {
        if (remaining.length === 0) break;

        const busyTeams = new Set<string>();
        let slotIndex = 0;

        for (let i = 0; i < remaining.length && slotIndex < timeSlots.length; ) {
          const [homeId, awayId] = remaining[i];
          if (busyTeams.has(homeId) || busyTeams.has(awayId)) {
            i++;
            continue;
          }

          busyTeams.add(homeId);
          busyTeams.add(awayId);

          const matchDate = new Date(dayStart);
          matchDate.setDate(matchDate.getDate() + weekOffset * 7);
          const [hours, minutes] = timeSlots[slotIndex].split(':').map(Number);
          matchDate.setHours(hours, minutes, 0, 0);

          fixtures.push(this.fixtureRepo.create({
            league: { id: leagueId } as any,
            date: matchDate,
            status: 'scheduled',
            homeTeam: { id: homeId } as any,
            awayTeam: { id: awayId } as any,
          }));

          remaining.splice(i, 1);
          slotIndex++;
        }
      }

      weekOffset++;
    }

    await this.fixtureRepo.save(fixtures);

    league.started = true;
    await this.leagueRepo.save(league);

    const saved = await this.fixtureRepo.find({
      where: { league: { id: leagueId } },
      relations: ['league', 'homeClub', 'awayClub', 'homeTeam', 'awayTeam'],
      order: { date: 'ASC' },
    });
    return saved.map(toFixtureResponse);
  }

  async deleteGoal(goalId: string): Promise<void> {
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    await this.goalRepo.remove(goal);
  }

  computeStandings(
    fixtures: FixtureEntity[],
    leagueType: 'club' | 'team',
  ): StandingsRow[] {
    const map = new Map<string, StandingsRow>();

    const getOrCreate = (id: string, name: string): StandingsRow => {
      if (!map.has(id)) {
        map.set(id, {
          participantId: id,
          participantName: name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          noShows: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        });
      }
      return map.get(id)!;
    };

    for (const f of fixtures) {
      if (f.status === 'scheduled') continue;

      const isClub = leagueType === 'club';
      const homeId = isClub
        ? (f.homeClub as any)?.id
        : (f.homeTeam as any)?.id;
      const awayId = isClub
        ? (f.awayClub as any)?.id
        : (f.awayTeam as any)?.id;
      const homeName = isClub
        ? (f.homeClub as any)?.name ?? ''
        : (f.homeTeam as any)?.name ?? '';
      const awayName = isClub
        ? (f.awayClub as any)?.name ?? ''
        : (f.awayTeam as any)?.name ?? '';

      if (!homeId || !awayId) continue;

      const home = getOrCreate(homeId, homeName);
      const away = getOrCreate(awayId, awayName);

      home.played++;
      away.played++;

      const hs = f.homeScore ?? 0;
      const as_ = f.awayScore ?? 0;
      home.goalsFor += hs;
      home.goalsAgainst += as_;
      away.goalsFor += as_;
      away.goalsAgainst += hs;

      if (f.status === 'no_show_home') {
        home.noShows++;
        home.points += 0;
        away.won++;
        away.points += 3;
      } else if (f.status === 'no_show_away') {
        away.noShows++;
        away.points += 0;
        home.won++;
        home.points += 3;
      } else if (hs > as_) {
        home.won++;
        home.points += 3;
        away.lost++;
        away.points += 1;
      } else if (hs < as_) {
        away.won++;
        away.points += 3;
        home.lost++;
        home.points += 1;
      } else {
        home.drawn++;
        home.points += 2;
        away.drawn++;
        away.points += 2;
      }
    }

    const rows = Array.from(map.values());
    for (const r of rows) {
      r.goalDifference = r.goalsFor - r.goalsAgainst;
    }

    rows.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
    return rows;
  }

  computeTopScorers(
    goals: GoalEntity[],
    fixtures: FixtureEntity[],
    leagueType: 'club' | 'team',
  ): TopScorer[] {
    const fixtureLabels = new Map<string, string>();
    for (const f of fixtures) {
      const isClub = leagueType === 'club';
      const home = isClub
        ? (f.homeClub as any)?.name ?? ''
        : (f.homeTeam as any)?.name ?? '';
      const away = isClub
        ? (f.awayClub as any)?.name ?? ''
        : (f.awayTeam as any)?.name ?? '';
      fixtureLabels.set(f.id, `${home} v ${away}`);
    }

    const map = new Map<string, TopScorer>();
    for (const g of goals) {
      const scorer = g.scorer as any;
      const id = scorer?.id;
      if (!id) continue;
      if (!map.has(id)) {
        const parts = [scorer?.firstName, scorer?.lastName].filter(Boolean);
        map.set(id, {
          userId: id,
          name: parts.length > 0 ? parts.join(' ') : scorer?.email ?? '',
          goals: 0,
          fixtures: [],
        });
      }
      const entry = map.get(id)!;
      entry.goals++;

      const fid = (g.fixture as any)?.id;
      if (fid) {
        const existing = entry.fixtures.find((sf) => sf.fixtureId === fid);
        if (existing) {
          existing.goals++;
        } else {
          entry.fixtures.push({
            fixtureId: fid,
            matchLabel: fixtureLabels.get(fid) ?? '',
            goals: 1,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.goals - a.goals);
  }
}
