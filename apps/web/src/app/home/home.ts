import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  type ClubWithTeams, type Team, type User,
  type League, type LeagueDetail, type Event,
} from '../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  clubs = signal<ClubWithTeams[]>([]);
  selectedClub = signal<ClubWithTeams | null>(null);
  selectedTeam = signal<Team | null>(null);
  teamMembers = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  leagues = signal<League[]>([]);
  selectedLeague = signal<League | null>(null);
  leagueDetail = signal<LeagueDetail | null>(null);

  events = signal<Event[]>([]);
  eventTab = signal<'upcoming' | 'past'>('upcoming');

  upcomingEvents = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.events()
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  });

  pastEvents = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.events()
      .filter((e) => e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  selectedTeams = computed<Team[]>(() => this.selectedClub()?.teams ?? []);

  constructor(public auth: AuthService) {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.loadClubs();
        this.loadLeagues();
        this.loadEvents();
      }
    });
  }

  async loadClubs(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const clubs = await this.auth.listMyClubs();
      this.clubs.set(clubs);
      if (clubs.length > 0) {
        this.selectedClub.set(clubs[0]);
      }
    } catch {
      this.error.set('Failed to load clubs. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  selectClub(club: ClubWithTeams): void {
    this.selectedClub.set(club);
    this.selectedTeam.set(null);
    this.teamMembers.set([]);
  }

  async selectTeam(team: Team): Promise<void> {
    if (this.selectedTeam()?.id === team.id) {
      this.selectedTeam.set(null);
      this.teamMembers.set([]);
      return;
    }
    this.selectedTeam.set(team);
    try {
      this.teamMembers.set(await this.auth.listTeamUsers(team.id));
    } catch {
      this.teamMembers.set([]);
    }
  }

  async loadLeagues(): Promise<void> {
    try {
      this.leagues.set(await this.auth.listLeagues());
    } catch {
      this.leagues.set([]);
    }
  }

  async loadEvents(): Promise<void> {
    try {
      this.events.set(await this.auth.listEvents());
    } catch {
      this.events.set([]);
    }
  }

  async selectLeague(league: League): Promise<void> {
    if (this.selectedLeague()?.id === league.id) {
      this.selectedLeague.set(null);
      this.leagueDetail.set(null);
      return;
    }
    this.selectedLeague.set(league);
    try {
      this.leagueDetail.set(await this.auth.getLeagueDetail(league.id));
    } catch {
      this.leagueDetail.set(null);
    }
  }
}
