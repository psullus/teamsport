import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Team } from '@teamsport/shared';
import { TeamEntity } from './entities/team.entity';
import { UserEntity } from './entities/user.entity';
import { toUserResponse } from './auth.service';
import type { User } from '@teamsport/shared';

function toTeamResponse(team: TeamEntity): Team {
  return {
    id: team.id,
    name: team.name,
    clubId: team.club?.id ?? '',
  };
}

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(TeamEntity)
    private teamRepo: Repository<TeamEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  async create(name: string, clubId: string): Promise<Team> {
    const team = this.teamRepo.create({
      name,
      club: { id: clubId },
    });
    const saved = await this.teamRepo.save(team);
    saved.club = { id: clubId } as any;
    return toTeamResponse(saved);
  }

  async listByClub(clubId: string): Promise<Team[]> {
    const teams = await this.teamRepo.find({
      where: { club: { id: clubId } },
      relations: ['club'],
    });
    return teams.map(toTeamResponse);
  }

  async addUser(teamId: string, userId: string): Promise<void> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['members'],
    });
    if (!team) throw new NotFoundException('Team not found');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    team.members.push(user);
    await this.teamRepo.save(team);
  }

  async removeUser(teamId: string, userId: string): Promise<void> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['members'],
    });
    if (!team) throw new NotFoundException('Team not found');
    team.members = team.members.filter((m) => m.id !== userId);
    await this.teamRepo.save(team);
  }

  async rename(teamId: string, name: string): Promise<Team> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['club'],
    });
    if (!team) throw new NotFoundException('Team not found');
    team.name = name;
    const saved = await this.teamRepo.save(team);
    return toTeamResponse(saved);
  }

  async delete(teamId: string): Promise<void> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    await this.teamRepo.remove(team);
  }

  async listUsers(teamId: string): Promise<User[]> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['members', 'members.organisation'],
    });
    if (!team) throw new NotFoundException('Team not found');
    return team.members.map(toUserResponse);
  }
}
