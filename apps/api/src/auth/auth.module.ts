import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { OrganisationService } from './organisation.service';
import { InviteService } from './invite.service';
import { ClubService } from './club.service';
import { TeamService } from './team.service';
import { LeagueService } from './league.service';
import { UserEntity } from './entities/user.entity';
import { OrganisationEntity } from './entities/organisation.entity';
import { EmailVerificationTokenEntity } from './entities/email-verification-token.entity';
import { InviteEntity } from './entities/invite.entity';
import { ClubEntity } from './entities/club.entity';
import { TeamEntity } from './entities/team.entity';
import { LeagueEntity } from './entities/league.entity';
import { FixtureEntity } from './entities/fixture.entity';
import { GoalEntity } from './entities/goal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrganisationEntity,
      EmailVerificationTokenEntity,
      InviteEntity,
      ClubEntity,
      TeamEntity,
      LeagueEntity,
      FixtureEntity,
      GoalEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, UserService, OrganisationService, InviteService,
    ClubService, TeamService, LeagueService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
