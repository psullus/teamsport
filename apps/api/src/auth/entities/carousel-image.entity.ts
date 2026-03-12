import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Relation,
} from 'typeorm';
import type { OrganisationEntity } from './organisation.entity';

@Entity('carousel_images')
export class CarouselImageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  imagePath!: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne('OrganisationEntity', { onDelete: 'CASCADE' })
  organisation!: Relation<OrganisationEntity>;
}
