import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ROLES } from '@teamsport/shared';
import type { User } from '@teamsport/shared';
import { InviteEntity } from './entities/invite.entity';
import { UserEntity } from './entities/user.entity';
import { OrganisationEntity } from './entities/organisation.entity';
import { toUserResponse } from './auth.service';

const SALT_ROUNDS = 10;

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(InviteEntity)
    private inviteRepo: Repository<InviteEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    @InjectRepository(OrganisationEntity)
    private orgRepo: Repository<OrganisationEntity>,
    private jwtService: JwtService,
  ) {}

  async createInvite(
    email: string,
    invitedById: string,
    organisationId: string,
  ): Promise<InviteEntity> {
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const inviter = await this.userRepo.findOne({
      where: { id: invitedById },
      relations: ['organisation'],
    });
    if (!inviter) {
      throw new NotFoundException('Inviting user not found');
    }

    const token = uuidv4();
    const invite = this.inviteRepo.create({
      email,
      token,
      organisation: inviter.organisation,
      invitedBy: inviter,
    });
    await this.inviteRepo.save(invite);

    console.log(`[Invite] http://localhost:4200/signup/invite?token=${token}`);
    return invite;
  }

  async listInvites(organisationId: string): Promise<InviteEntity[]> {
    return this.inviteRepo.find({
      where: { organisation: { id: organisationId } },
      relations: ['organisation', 'invitedBy'],
    });
  }

  async acceptInvite(
    email: string,
    password: string,
    inviteToken: string,
  ): Promise<{ user: User; token: string }> {
    const invite = await this.inviteRepo.findOne({
      where: { token: inviteToken },
      relations: ['organisation'],
    });
    if (!invite) {
      throw new BadRequestException('Invalid or expired invite token');
    }
    if (invite.email !== email) {
      throw new BadRequestException('Email does not match invite');
    }

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = this.userRepo.create({
      email,
      passwordHash,
      role: ROLES.USER,
      emailVerified: true,
      organisation: invite.organisation,
    });
    await this.userRepo.save(user);
    await this.inviteRepo.remove(invite);

    const jwt = this.jwtService.sign({ sub: user.id, role: user.role });
    return { user: toUserResponse(user), token: jwt };
  }
}
