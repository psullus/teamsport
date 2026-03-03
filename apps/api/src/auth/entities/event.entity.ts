import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'varchar' })
  date!: string;

  @Column({ type: 'varchar', nullable: true })
  startTime!: string | null;

  @Column({ type: 'varchar', nullable: true })
  endTime!: string | null;

  @Column({ type: 'boolean', default: false })
  allDay!: boolean;

  @Column({ type: 'varchar', nullable: true })
  primaryContact!: string | null;

  @Column({ type: 'varchar', nullable: true })
  secondaryContact!: string | null;

  @Column({ type: 'varchar' })
  hostedByName!: string;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  organisation!: OrganisationEntity;

  @CreateDateColumn()
  createdAt!: Date;
}
