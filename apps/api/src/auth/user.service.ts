import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { Role, User, ClubWithTeams } from '@teamsport/shared';
import { UserEntity } from './entities/user.entity';
import { toUserResponse } from './auth.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  async listByOrganisation(organisationId: string): Promise<User[]> {
    const users = await this.userRepo.find({
      where: { organisation: { id: organisationId } },
      relations: ['organisation'],
    });
    return users.map(toUserResponse);
  }

  async listAll(): Promise<User[]> {
    const users = await this.userRepo.find({ relations: ['organisation'] });
    return users.map(toUserResponse);
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async changeRole(id: string, role: Role): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['organisation'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    await this.userRepo.save(user);
    return toUserResponse(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['organisation'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phone !== undefined) user.phone = dto.phone;

    if (avatarFile) {
      if (user.avatarPath) {
        const oldPath = join(__dirname, '..', '..', 'uploads', user.avatarPath);
        await fs.unlink(oldPath).catch(() => {});
      }
      user.avatarPath = `avatars/${avatarFile.filename}`;
    }

    await this.userRepo.save(user);
    return toUserResponse(user);
  }

  async getUserClubsWithTeams(userId: string): Promise<ClubWithTeams[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['clubs', 'clubs.organisation', 'teams', 'teams.club'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userTeamsByClubId = new Map<string, typeof user.teams>();
    for (const team of user.teams) {
      const clubId = team.club.id;
      if (!userTeamsByClubId.has(clubId)) {
        userTeamsByClubId.set(clubId, []);
      }
      userTeamsByClubId.get(clubId)!.push(team);
    }

    return user.clubs.map((club) => ({
      id: club.id,
      name: club.name,
      organisationId: club.organisation.id,
      teams: (userTeamsByClubId.get(club.id) ?? []).map((team) => ({
        id: team.id,
        name: team.name,
        clubId: club.id,
      })),
    }));
  }

  async removeAvatar(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['organisation'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatarPath) {
      const filePath = join(__dirname, '..', '..', 'uploads', user.avatarPath);
      await fs.unlink(filePath).catch(() => {});
      user.avatarPath = null;
      await this.userRepo.save(user);
    }

    return toUserResponse(user);
  }
}
