import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Role, User } from '@teamsport/shared';
import { UserEntity } from './entities/user.entity';
import { toUserResponse } from './auth.service';

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
}
