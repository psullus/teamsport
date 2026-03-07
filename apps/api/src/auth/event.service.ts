import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Event } from '@teamsport/shared';
import { EventEntity } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

function toEventResponse(entity: EventEntity): Event {
  return {
    id: entity.id,
    title: entity.title,
    date: entity.date,
    startTime: entity.startTime,
    endTime: entity.endTime,
    allDay: entity.allDay,
    primaryContact: entity.primaryContact,
    secondaryContact: entity.secondaryContact,
    hostedByName: entity.hostedByName,
    location: entity.location,
    description: entity.description,
    organisationId: entity.organisation?.id ?? '',
    createdAt: entity.createdAt instanceof Date
      ? entity.createdAt.toISOString()
      : String(entity.createdAt),
  };
}

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private eventRepo: Repository<EventEntity>,
  ) {}

  async create(organisationId: string, dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create({
      title: dto.title,
      date: dto.date,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
      allDay: dto.allDay ?? false,
      primaryContact: dto.primaryContact ?? null,
      secondaryContact: dto.secondaryContact ?? null,
      hostedByName: dto.hostedByName,
      location: dto.location ?? null,
      description: dto.description ?? null,
      organisation: { id: organisationId },
    });
    const saved = await this.eventRepo.save(event);
    saved.organisation = { id: organisationId } as any;
    return toEventResponse(saved);
  }

  async listByOrganisation(organisationId: string): Promise<Event[]> {
    const events = await this.eventRepo.find({
      where: { organisation: { id: organisationId } },
      relations: ['organisation'],
      order: { date: 'DESC' },
    });
    return events.map(toEventResponse);
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['organisation'],
    });
    if (!event) throw new NotFoundException('Event not found');

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.date !== undefined) event.date = dto.date;
    if (dto.startTime !== undefined) event.startTime = dto.startTime;
    if (dto.endTime !== undefined) event.endTime = dto.endTime;
    if (dto.allDay !== undefined) event.allDay = dto.allDay;
    if (dto.primaryContact !== undefined) event.primaryContact = dto.primaryContact;
    if (dto.secondaryContact !== undefined) event.secondaryContact = dto.secondaryContact;
    if (dto.hostedByName !== undefined) event.hostedByName = dto.hostedByName;
    if (dto.location !== undefined) event.location = dto.location;
    if (dto.description !== undefined) event.description = dto.description;

    const saved = await this.eventRepo.save(event);
    return toEventResponse(saved);
  }

  async delete(id: string): Promise<void> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    await this.eventRepo.remove(event);
  }
}
