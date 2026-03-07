import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ROLES } from '@teamsport/shared';
import type { User } from '@teamsport/shared';
import { UserEntity } from './entities/user.entity';
import { OrganisationEntity } from './entities/organisation.entity';
import { EmailVerificationTokenEntity } from './entities/email-verification-token.entity';
import { ClubEntity } from './entities/club.entity';
import { ClubMemberEntity } from './entities/club-member.entity';
import { TeamEntity } from './entities/team.entity';
import { EmailService } from './email.service';

const SALT_ROUNDS = 10;

export function toUserResponse(user: UserEntity): User {
  return {
    id: user.id,
    organisationName: user.organisation?.name ?? '',
    organisationId: user.organisation?.id ?? '',
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    phone: user.phone ?? null,
    avatarUrl: user.avatarPath
      ? process.env.BUCKET_NAME
        ? `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${user.avatarPath}`
        : `/api/uploads/${user.avatarPath}`
      : null,
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    @InjectRepository(OrganisationEntity)
    private orgRepo: Repository<OrganisationEntity>,
    @InjectRepository(EmailVerificationTokenEntity)
    private emailTokenRepo: Repository<EmailVerificationTokenEntity>,
    @InjectRepository(ClubEntity)
    private clubRepo: Repository<ClubEntity>,
    @InjectRepository(ClubMemberEntity)
    private clubMemberRepo: Repository<ClubMemberEntity>,
    @InjectRepository(TeamEntity)
    private teamRepo: Repository<TeamEntity>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signup(
    organisationName: string,
    rawEmail: string,
    password: string,
    clubName: string,
    clubType: string,
    teamName: string,
  ): Promise<{ user: User; token: string }> {
    const email = rawEmail.toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const org = this.orgRepo.create({ name: organisationName });
    await this.orgRepo.save(org);

    const club = this.clubRepo.create({ name: clubName, type: clubType, organisation: org });
    await this.clubRepo.save(club);

    const team = this.teamRepo.create({ name: teamName, club });
    await this.teamRepo.save(team);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = this.userRepo.create({
      email,
      passwordHash,
      role: ROLES.ADMIN,
      organisation: org,
    });
    await this.userRepo.save(user);

    const membership = this.clubMemberRepo.create({ user, club });
    await this.clubMemberRepo.save(membership);
    team.members = [user];
    await this.teamRepo.save(team);

    await this.createEmailVerificationToken(user);

    const jwt = this.signToken(user);
    return { user: toUserResponse(user), token: jwt };
  }

  async login(rawEmail: string, password: string): Promise<{ user: User; token: string }> {
    const email = rawEmail.toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['organisation'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const jwt = this.signToken(user);
    return { user: toUserResponse(user), token: jwt };
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['organisation'],
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return toUserResponse(user);
  }

  async verifyEmail(token: string): Promise<void> {
    const emailToken = await this.emailTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });
    if (!emailToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    emailToken.user.emailVerified = true;
    await this.userRepo.save(emailToken.user);
    await this.emailTokenRepo.remove(emailToken);
  }

  signToken(user: UserEntity): string {
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }

  async createEmailVerificationToken(user: UserEntity): Promise<void> {
    const token = uuidv4();
    const emailToken = this.emailTokenRepo.create({ token, user });
    await this.emailTokenRepo.save(emailToken);
    await this.emailService.sendVerificationEmail(user.email, token);
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const existing = await this.emailTokenRepo.findOne({ where: { user: { id: userId } } });
    if (existing) {
      const age = Date.now() - existing.createdAt.getTime();
      if (age < 60_000) {
        throw new HttpException('Please wait before requesting another email', 429);
      }
      await this.emailTokenRepo.remove(existing);
    }

    await this.createEmailVerificationToken(user);
  }
}
