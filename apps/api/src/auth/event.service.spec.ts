import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { EventEntity } from './entities/event.entity';

const mockEvent = {
  id: 'event-1',
  title: 'Training Session',
  date: '2026-03-10',
  startTime: '18:00',
  endTime: '19:30',
  allDay: false,
  primaryContact: 'John 555-1234',
  secondaryContact: null,
  hostedByName: 'My Club',
  location: 'Main Pitch',
  description: 'Weekly training',
  organisation: { id: 'org-1' },
  createdAt: new Date('2026-03-01T00:00:00Z'),
};

const mockRepo = {
  create: vi.fn((data) => ({ ...mockEvent, ...data })),
  save: vi.fn((entity) => Promise.resolve({ ...mockEvent, ...entity })),
  find: vi.fn().mockResolvedValue([mockEvent]),
  findOne: vi.fn().mockResolvedValue(mockEvent),
  remove: vi.fn().mockResolvedValue(undefined),
};

describe('EventService', () => {
  let service: EventService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: getRepositoryToken(EventEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(EventService);
  });

  describe('create', () => {
    it('should create and return an event', async () => {
      const result = await service.create('org-1', {
        title: 'Training Session',
        date: '2026-03-10',
        startTime: '18:00',
        endTime: '19:30',
        hostedByName: 'My Club',
      });

      expect(result.title).toBe('Training Session');
      expect(result.date).toBe('2026-03-10');
      expect(result.organisationId).toBe('org-1');
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should default allDay to false and nullable fields to null', async () => {
      const result = await service.create('org-1', {
        title: 'Match',
        date: '2026-03-15',
        hostedByName: 'Opponent Club',
      });

      expect(result.allDay).toBe(false);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allDay: false,
          startTime: null,
          endTime: null,
          primaryContact: null,
          secondaryContact: null,
          location: null,
          description: null,
        }),
      );
    });
  });

  describe('listByOrganisation', () => {
    it('should return events for the organisation', async () => {
      const result = await service.listByOrganisation('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Training Session');
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { organisation: { id: 'org-1' } },
        relations: ['organisation'],
        order: { date: 'DESC' },
      });
    });
  });

  describe('update', () => {
    it('should update and return the event', async () => {
      const result = await service.update('event-1', { title: 'Updated Session' });

      expect(result.title).toBe('Updated Session');
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        relations: ['organisation'],
      });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update('bad-id', { title: 'X' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should remove the event', async () => {
      await service.delete('event-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'event-1' } });
      expect(mockRepo.remove).toHaveBeenCalledWith(mockEvent);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.delete('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
