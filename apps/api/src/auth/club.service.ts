import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Club, SportType } from '@teamsport/shared';
import { POSITIONS_BY_SPORT } from '@teamsport/shared';
import { ClubEntity } from './entities/club.entity';
import { ClubMemberEntity } from './entities/club-member.entity';
import { UserEntity } from './entities/user.entity';
import { toUserResponse } from './auth.service';
import type { User } from '@teamsport/shared';

function toClubResponse(club: ClubEntity): Club {
  return {
    id: club.id,
    name: club.name,
    type: club.type as SportType,
    organisationId: club.organisation?.id ?? '',
  };
}

@Injectable()
export class ClubService {
  constructor(
    @InjectRepository(ClubEntity)
    private clubRepo: Repository<ClubEntity>,
    @InjectRepository(ClubMemberEntity)
    private clubMemberRepo: Repository<ClubMemberEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  async create(name: string, type: string, organisationId: string): Promise<Club> {
    const club = this.clubRepo.create({
      name,
      type,
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
    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const membership = this.clubMemberRepo.create({ club: { id: clubId } as any, user: { id: userId } as any });
    await this.clubMemberRepo.save(membership);
  }

  async removeUser(clubId: string, userId: string): Promise<void> {
    const result = await this.clubMemberRepo.delete({ club: { id: clubId } as any, user: { id: userId } as any });
    if (result.affected === 0) {
      throw new NotFoundException('Membership not found');
    }
  }

  async update(clubId: string, name: string, type?: string): Promise<Club> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['organisation'],
    });
    if (!club) throw new NotFoundException('Club not found');
    club.name = name;
    if (type !== undefined) club.type = type;
    const saved = await this.clubRepo.save(club);
    return toClubResponse(saved);
  }

  async delete(clubId: string): Promise<void> {
    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');
    await this.clubRepo.remove(club);
  }

  async listUsers(clubId: string): Promise<User[]> {
    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');
    const memberships = await this.clubMemberRepo.find({
      where: { club: { id: clubId } },
      relations: ['user', 'user.organisation'],
    });
    return memberships.map((m) => toUserResponse(m.user as any));
  }

  async updatePosition(clubId: string, userId: string, position: string | null): Promise<void> {
    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    if (position) {
      const validPositions = POSITIONS_BY_SPORT[club.type as SportType];
      if (validPositions && !validPositions.includes(position)) {
        throw new BadRequestException(`Invalid position for sport type ${club.type}`);
      }
    }

    const membership = await this.clubMemberRepo.findOne({
      where: { club: { id: clubId }, user: { id: userId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    membership.position = position ?? null;
    await this.clubMemberRepo.save(membership);
  }
}
