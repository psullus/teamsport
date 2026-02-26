/** Standard user within an organisation */
export const USER = 'USER' as const;
/** Organisation administrator */
export const ADMIN = 'ADMIN' as const;
/** Overall system access */
export const CONTROL = 'CONTROL' as const;

export const ROLES = { USER, ADMIN, CONTROL } as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface Organisation {
  id: string;
  name: string;
}

export interface User {
  id: string;
  organisationName: string;
  organisationId: string;
  email: string;
  emailVerified: boolean;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface Club {
  id: string;
  name: string;
  organisationId: string;
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
}

export interface ClubWithTeams {
  id: string;
  name: string;
  organisationId: string;
  teams: Team[];
}

export type LeagueType = 'club' | 'team';

export type FixtureStatus = 'scheduled' | 'completed' | 'no_show_home' | 'no_show_away';

export interface League {
  id: string;
  name: string;
  type: LeagueType;
  organisationId: string;
  clubId: string | null;
}

export interface Fixture {
  id: string;
  leagueId: string;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  date: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: FixtureStatus;
}

export interface Goal {
  id: string;
  fixtureId: string;
  scorerId: string;
  scorerName: string;
}

export interface StandingsRow {
  participantId: string;
  participantName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  noShows: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface ScorerFixture {
  fixtureId: string;
  matchLabel: string;
  goals: number;
}

export interface TopScorer {
  userId: string;
  name: string;
  goals: number;
  fixtures: ScorerFixture[];
}

export interface LeagueDetail {
  league: League;
  participants: Team[];
  fixtures: Fixture[];
  goals: Record<string, Goal[]>;
  standings: StandingsRow[];
  topScorers: TopScorer[];
}
