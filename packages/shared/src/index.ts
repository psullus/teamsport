/** Standard user within an organisation */
export const USER = 'USER' as const;
/** Organisation administrator */
export const ADMIN = 'ADMIN' as const;
/** Overall system access */
export const CONTROL = 'CONTROL' as const;

export const ROLES = { USER, ADMIN, CONTROL } as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const SPORT_TYPES = [
  'Touch',
  'Soccer',
  'Football',
  'Hurling',
  'Camogie',
  'Rugby',
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

export const POSITIONS_BY_SPORT: Record<SportType, string[]> = {
  Touch: ['Middle', 'Link', 'Wing', 'Sub'],
  Soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Sub'],
  Football: ['Goalkeeper', 'Full-back', 'Half-back', 'Midfielder', 'Half-forward', 'Full-forward', 'Sub'],
  Hurling: ['Goalkeeper', 'Full-back', 'Half-back', 'Midfielder', 'Half-forward', 'Full-forward', 'Sub'],
  Camogie: ['Goalkeeper', 'Full-back', 'Half-back', 'Midfielder', 'Half-forward', 'Full-forward', 'Sub'],
  Rugby: ['Prop', 'Hooker', 'Lock', 'Flanker', 'Number 8', 'Scrum-half', 'Fly-half', 'Centre', 'Wing', 'Fullback', 'Sub'],
};

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
  type: SportType;
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
  type: SportType;
  organisationId: string;
  teams: Team[];
}

export interface ClubMembership {
  clubId: string;
  clubName: string;
  clubType: SportType;
  position: string | null;
}

export type LeagueType = 'club' | 'team';

export type FixtureStatus = 'scheduled' | 'completed' | 'no_show_home' | 'no_show_away';

export interface League {
  id: string;
  name: string;
  type: LeagueType;
  organisationId: string;
  clubId: string | null;
  started: boolean;
  archived: boolean;
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

export interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  primaryContact: string | null;
  secondaryContact: string | null;
  hostedByName: string;
  location: string | null;
  description: string | null;
  organisationId: string;
  createdAt: string;
}

export interface LeagueDetail {
  league: League;
  participants: Team[];
  fixtures: Fixture[];
  goals: Record<string, Goal[]>;
  standings: StandingsRow[];
  topScorers: TopScorer[];
}
