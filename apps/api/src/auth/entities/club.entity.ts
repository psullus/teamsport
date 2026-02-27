import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Relation,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import type { TeamEntity } from './team.entity';
import type { UserEntity } from './user.entity';

@Entity('clubs')
export class ClubEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => OrganisationEntity, (org) => org.clubs, { onDelete: 'CASCADE' })
  organisation!: OrganisationEntity;

  @OneToMany('TeamEntity', 'club')
  teams!: Relation<TeamEntity[]>;

  @ManyToMany('UserEntity', 'clubs')
  @JoinTable({ name: 'club_members' })
  members!: Relation<UserEntity[]>;

  @CreateDateColumn()
  createdAt!: Date;
}
