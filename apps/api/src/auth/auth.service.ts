import {
  BadRequestException,
  ConflictException,
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

const SALT_ROUNDS = 10;

export function toUserResponse(user: UserEntity): User {
  return {
    id: user.id,
    organisationName: user.organisation?.name ?? '',
    organisationId: user.organisation?.id ?? '',
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
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
    private jwtService: JwtService,
  ) {}

  async signup(
    organisationName: string,
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const org = this.orgRepo.create({ name: organisationName });
    await this.orgRepo.save(org);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = this.userRepo.create({
      email,
      passwordHash,
      role: ROLES.ADMIN,
      organisation: org,
    });
    await this.userRepo.save(user);

    await this.createEmailVerificationToken(user);

    const jwt = this.signToken(user);
    return { user: toUserResponse(user), token: jwt };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
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

  private async createEmailVerificationToken(user: UserEntity): Promise<void> {
    const token = uuidv4();
    const emailToken = this.emailTokenRepo.create({ token, user });
    await this.emailTokenRepo.save(emailToken);
    console.log(`[Email Verification] http://localhost:4200/verify-email?token=${token}`);
  }
}
