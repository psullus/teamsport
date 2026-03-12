import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationEntity } from './entities/notification.entity';

const mockRepo = {
  create: vi.fn((data) => ({ ...data, id: 'notif-1' })),
  save: vi.fn((entity) => Promise.resolve(entity)),
  find: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(NotificationEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const result = await service.create('user-1', 'Hello', 'join_request', 'ref-1');
      expect(mockRepo.create).toHaveBeenCalledWith({
        user: { id: 'user-1' },
        message: 'Hello',
        type: 'join_request',
        referenceId: 'ref-1',
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('notif-1');
    });

    it('should default referenceId to null when not provided', async () => {
      await service.create('user-1', 'Hello', 'join_request');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ referenceId: null }),
      );
    });
  });

  describe('listUnread', () => {
    it('should return unread notifications for user', async () => {
      const notifications = [
        { id: 'n1', message: 'Test', read: false },
        { id: 'n2', message: 'Test2', read: false },
      ];
      mockRepo.find.mockResolvedValue(notifications);

      const result = await service.listUnread('user-1');
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, read: false },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('countUnread', () => {
    it('should return count of unread notifications', async () => {
      mockRepo.count.mockResolvedValue(5);

      const result = await service.countUnread('user-1');
      expect(result).toBe(5);
      expect(mockRepo.count).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' }, read: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });

      await service.markAsRead('notif-1', 'user-1');
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'notif-1', user: { id: 'user-1' } },
        { read: true },
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      mockRepo.update.mockResolvedValue({ affected: 3 });

      await service.markAllAsRead('user-1');
      expect(mockRepo.update).toHaveBeenCalledWith(
        { user: { id: 'user-1' }, read: false },
        { read: true },
      );
    });
  });
});
