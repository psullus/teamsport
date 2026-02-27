import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Organisation } from '@teamsport/shared';
import { OrganisationEntity } from './entities/organisation.entity';

@Injectable()
export class OrganisationService {
  constructor(
    @InjectRepository(OrganisationEntity)
    private orgRepo: Repository<OrganisationEntity>,
  ) {}

  async listAll(): Promise<Organisation[]> {
    const orgs = await this.orgRepo.find();
    return orgs.map((org) => ({ id: org.id, name: org.name }));
  }

  async deleteOrganisation(id: string): Promise<void> {
    const result = await this.orgRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Organisation not found');
    }
  }
}
