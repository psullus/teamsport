import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepo: Repository<NotificationEntity>,
  ) {}

  async create(
    userId: string,
    message: string,
    type: string,
    referenceId?: string,
  ): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      user: { id: userId } as any,
      message,
      type,
      referenceId: referenceId ?? null,
    });
    return this.notificationRepo.save(notification);
  }

  async listUnread(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo.find({
      where: { user: { id: userId }, read: false },
      order: { createdAt: 'DESC' },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { user: { id: userId }, read: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepo.update(
      { id, user: { id: userId } },
      { read: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { user: { id: userId }, read: false },
      { read: true },
    );
  }
}
