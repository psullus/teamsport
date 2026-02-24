import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import type { OrganisationEntity } from './organisation.entity';
import type { ClubEntity } from './club.entity';

@Entity('leagues')
export class LeagueEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: ['club', 'team'] })
  type!: 'club' | 'team';

  @ManyToOne('OrganisationEntity', { onDelete: 'CASCADE' })
  organisation!: Relation<OrganisationEntity>;

  @ManyToOne('ClubEntity', { nullable: true, onDelete: 'CASCADE' })
  club!: Relation<ClubEntity> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
