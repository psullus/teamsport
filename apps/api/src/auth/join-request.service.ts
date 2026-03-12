import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JoinRequest } from '@teamsport/shared';
import { JoinRequestEntity } from './entities/join-request.entity';
import { ClubEntity } from './entities/club.entity';
import { TeamEntity } from './entities/team.entity';
import { UserEntity } from './entities/user.entity';
import { ClubService } from './club.service';
import { TeamService } from './team.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { ROLES } from '@teamsport/shared';

function toResponse(req: JoinRequestEntity, targetName: string): JoinRequest {
  const user = req.user as any;
  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const userName = `${firstName} ${lastName}`.trim() || user?.email || '';
  return {
    id: req.id,
    userId: user?.id ?? '',
    userName,
    userEmail: user?.email ?? '',
    targetType: req.targetType as any,
    targetId: req.targetId,
    targetName,
    status: req.status as any,
    createdAt: req.createdAt?.toISOString() ?? '',
    respondedAt: req.respondedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class JoinRequestService {
  constructor(
    @InjectRepository(JoinRequestEntity)
    private joinRequestRepo: Repository<JoinRequestEntity>,
    @InjectRepository(ClubEntity)
    private clubRepo: Repository<ClubEntity>,
    @InjectRepository(TeamEntity)
    private teamRepo: Repository<TeamEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private clubService: ClubService,
    private teamService: TeamService,
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, targetType: string, targetId: string): Promise<JoinRequest> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['organisation'],
    });
    if (!user) throw new NotFoundException('User not found');

    let targetName = '';

    if (targetType === 'club') {
      const club = await this.clubRepo.findOne({
        where: { id: targetId },
        relations: ['organisation'],
      });
      if (!club) throw new NotFoundException('Club not found');
      if (club.organisation.id !== user.organisation.id) {
        throw new BadRequestException('Club is not in your organisation');
      }
      targetName = club.name;
    } else if (targetType === 'team') {
      const team = await this.teamRepo.findOne({
        where: { id: targetId },
        relations: ['club', 'club.organisation'],
      });
      if (!team) throw new NotFoundException('Team not found');
      if (team.club.organisation.id !== user.organisation.id) {
        throw new BadRequestException('Team is not in your organisation');
      }
      targetName = team.name;
    } else {
      throw new BadRequestException('Invalid target type');
    }

    const existing = await this.joinRequestRepo.findOne({
      where: {
        user: { id: userId },
        targetType,
        targetId,
        status: 'pending',
      },
    });
    if (existing) throw new ConflictException('You already have a pending request');

    const joinRequest = this.joinRequestRepo.create({
      user: { id: userId } as any,
      targetType,
      targetId,
    });
    const saved = await this.joinRequestRepo.save(joinRequest);
    saved.user = user as any;

    // Notify admins
    const admins = await this.userRepo.find({
      where: {
        organisation: { id: user.organisation.id },
        role: ROLES.ADMIN,
      },
    });

    const requesterName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

    for (const admin of admins) {
      await this.notificationService.create(
        admin.id,
        `${requesterName} requested to join ${targetType} "${targetName}"`,
        'join_request',
        saved.id,
      );
      await this.emailService.sendJoinRequestEmail(
        admin.email,
        requesterName,
        targetName,
        targetType,
      );
    }

    return toResponse(saved, targetName);
  }

  async listPendingForOrganisation(orgId: string): Promise<JoinRequest[]> {
    const requests = await this.joinRequestRepo.find({
      where: {
        status: 'pending',
        user: { organisation: { id: orgId } },
      },
      relations: ['user', 'user.organisation'],
      order: { createdAt: 'DESC' },
    });

    const results: JoinRequest[] = [];
    for (const req of requests) {
      const targetName = await this.getTargetName(req.targetType, req.targetId);
      results.push(toResponse(req, targetName));
    }
    return results;
  }

  async listMyRequests(userId: string): Promise<JoinRequest[]> {
    const requests = await this.joinRequestRepo.find({
      where: { user: { id: userId } },
      relations: ['user', 'user.organisation'],
      order: { createdAt: 'DESC' },
    });

    const results: JoinRequest[] = [];
    for (const req of requests) {
      const targetName = await this.getTargetName(req.targetType, req.targetId);
      results.push(toResponse(req, targetName));
    }
    return results;
  }

  async respond(requestId: string, status: string): Promise<JoinRequest> {
    const request = await this.joinRequestRepo.findOne({
      where: { id: requestId },
      relations: ['user', 'user.organisation'],
    });
    if (!request) throw new NotFoundException('Join request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been responded to');
    }

    request.status = status;
    request.respondedAt = new Date();
    await this.joinRequestRepo.save(request);

    const targetName = await this.getTargetName(request.targetType, request.targetId);
    const user = request.user as any;

    if (status === 'approved') {
      if (request.targetType === 'club') {
        await this.clubService.addUser(request.targetId, user.id);
      } else if (request.targetType === 'team') {
        await this.teamService.addUser(request.targetId, user.id);
      }
      await this.notificationService.create(
        user.id,
        `Your request to join ${request.targetType} "${targetName}" was approved`,
        'join_request_approved',
        request.id,
      );
    } else {
      await this.notificationService.create(
        user.id,
        `Your request to join ${request.targetType} "${targetName}" was rejected`,
        'join_request_rejected',
        request.id,
      );
    }

    return toResponse(request, targetName);
  }

  private async getTargetName(targetType: string, targetId: string): Promise<string> {
    if (targetType === 'club') {
      const club = await this.clubRepo.findOne({ where: { id: targetId } });
      return club?.name ?? 'Unknown';
    } else {
      const team = await this.teamRepo.findOne({ where: { id: targetId } });
      return team?.name ?? 'Unknown';
    }
  }
}
