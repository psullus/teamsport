import { Component, computed, effect, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  type ClubWithTeams, type Team, type User, type Club,
  type League, type LeagueDetail, type Event, type JoinRequest,
  type CarouselImage,
} from '../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  activeView = signal<'home' | 'clubs' | 'teams' | 'leagues' | 'events'>('home');

  clubs = signal<ClubWithTeams[]>([]);
  selectedClub = signal<ClubWithTeams | null>(null);
  selectedTeam = signal<Team | null>(null);
  teamMembers = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  leagues = signal<League[]>([]);
  selectedLeague = signal<League | null>(null);
  leagueDetail = signal<LeagueDetail | null>(null);

  availableClubs = signal<Club[]>([]);
  availableTeams = signal<Record<string, Team[]>>({});
  myJoinRequests = signal<JoinRequest[]>([]);
  requestLoading = signal<Record<string, boolean>>({});
  expandedClubs = signal<Record<string, boolean>>({});

  homeMessage = signal<string | null>(null);
  carouselImages = signal<CarouselImage[]>([]);
  carouselIndex = signal(0);

  leagueDetailTab = signal<'standings' | 'fixtures' | 'scorers'>('fixtures');

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

  allMyTeams = computed(() => {
    const clubs = this.clubs();
    return clubs.flatMap((club) =>
      club.teams.map((team) => ({ ...team, clubName: club.name }))
    );
  });

  setView(view: 'home' | 'clubs' | 'teams' | 'leagues' | 'events'): void {
    this.activeView.set(view);
  }

  pendingRequests = computed(() =>
    this.myJoinRequests().filter((r) => r.status === 'pending'),
  );

  constructor(public auth: AuthService) {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.loadHomeContent();
        this.loadClubs();
        this.loadLeagues();
        this.loadEvents();
      }
    });
  }

  async loadHomeContent(): Promise<void> {
    try {
      const content = await this.auth.getHomeContent();
      this.homeMessage.set(content.message);
      this.carouselImages.set(content.images);
    } catch {
      this.homeMessage.set(null);
      this.carouselImages.set([]);
    }
  }

  prevSlide(): void {
    const images = this.carouselImages();
    if (images.length === 0) return;
    this.carouselIndex.update((i) => (i - 1 + images.length) % images.length);
  }

  nextSlide(): void {
    const images = this.carouselImages();
    if (images.length === 0) return;
    this.carouselIndex.update((i) => (i + 1) % images.length);
  }

  async loadClubs(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const clubs = await this.auth.listMyClubs();
      this.clubs.set(clubs);
      if (clubs.length > 0) {
        this.selectedClub.set(clubs[0]);
      } else {
        this.loadBrowseData();
      }
    } catch {
      this.error.set('Failed to load clubs. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadBrowseData(): Promise<void> {
    try {
      const [clubs, requests] = await Promise.all([
        this.auth.listOrgClubs(),
        this.auth.listMyJoinRequests(),
      ]);
      this.availableClubs.set(clubs);
      this.myJoinRequests.set(requests);
    } catch {
      this.availableClubs.set([]);
      this.myJoinRequests.set([]);
    }
  }

  async toggleClubTeams(clubId: string): Promise<void> {
    const expanded = this.expandedClubs();
    if (expanded[clubId]) {
      this.expandedClubs.update((m) => ({ ...m, [clubId]: false }));
      return;
    }
    this.expandedClubs.update((m) => ({ ...m, [clubId]: true }));
    if (!this.availableTeams()[clubId]) {
      try {
        const teams = await this.auth.listOrgClubTeams(clubId);
        this.availableTeams.update((m) => ({ ...m, [clubId]: teams }));
      } catch {
        this.availableTeams.update((m) => ({ ...m, [clubId]: [] }));
      }
    }
  }

  hasPendingRequest(targetType: string, targetId: string): boolean {
    return this.myJoinRequests().some(
      (r) => r.targetType === targetType && r.targetId === targetId && r.status === 'pending',
    );
  }

  async requestToJoin(targetType: string, targetId: string): Promise<void> {
    const key = `${targetType}:${targetId}`;
    this.requestLoading.update((m) => ({ ...m, [key]: true }));
    try {
      const request = await this.auth.createJoinRequest(targetType, targetId);
      this.myJoinRequests.update((list) => [request, ...list]);
    } catch {
      // ignore
    } finally {
      this.requestLoading.update((m) => ({ ...m, [key]: false }));
    }
  }

  isRequestLoading(targetType: string, targetId: string): boolean {
    return this.requestLoading()[`${targetType}:${targetId}`] ?? false;
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
