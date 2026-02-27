import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Club } from '@teamsport/shared';
import { ClubEntity } from './entities/club.entity';
import { UserEntity } from './entities/user.entity';
import { toUserResponse } from './auth.service';
import type { User } from '@teamsport/shared';

function toClubResponse(club: ClubEntity): Club {
  return {
    id: club.id,
    name: club.name,
    organisationId: club.organisation?.id ?? '',
  };
}

@Injectable()
export class ClubService {
  constructor(
    @InjectRepository(ClubEntity)
    private clubRepo: Repository<ClubEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  async create(name: string, organisationId: string): Promise<Club> {
    const club = this.clubRepo.create({
      name,
      organisation: { id: organisationId },
    });
    const saved = await this.clubRepo.save(club);
    saved.organisation = { id: organisationId } as any;
    return toClubResponse(saved);
  }

  async listByOrganisation(organisationId: string): Promise<Club[]> {
    const clubs = await this.clubRepo.find({
      where: { organisation: { id: organisationId } },
      relations: ['organisation'],
    });
    return clubs.map(toClubResponse);
  }

  async addUser(clubId: string, userId: string): Promise<void> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['members'],
    });
    if (!club) throw new NotFoundException('Club not found');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    club.members.push(user);
    await this.clubRepo.save(club);
  }

  async removeUser(clubId: string, userId: string): Promise<void> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['members'],
    });
    if (!club) throw new NotFoundException('Club not found');
    club.members = club.members.filter((m) => m.id !== userId);
    await this.clubRepo.save(club);
  }

  async rename(clubId: string, name: string): Promise<Club> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['organisation'],
    });
    if (!club) throw new NotFoundException('Club not found');
    club.name = name;
    const saved = await this.clubRepo.save(club);
    return toClubResponse(saved);
  }

  async delete(clubId: string): Promise<void> {
    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');
    await this.clubRepo.remove(club);
  }

  async listUsers(clubId: string): Promise<User[]> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['members', 'members.organisation'],
    });
    if (!club) throw new NotFoundException('Club not found');
    return club.members.map(toUserResponse);
  }
}
