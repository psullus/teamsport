import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import type { TeamEntity } from './team.entity';
import type { ClubMemberEntity } from './club-member.entity';

@Entity('clubs')
export class ClubEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', default: 'Touch' })
  type!: string;

  @ManyToOne(() => OrganisationEntity, (org) => org.clubs, { onDelete: 'CASCADE' })
  organisation!: OrganisationEntity;

  @OneToMany('TeamEntity', 'club')
  teams!: Relation<TeamEntity[]>;

  @OneToMany('ClubMemberEntity', 'club')
  memberships!: Relation<ClubMemberEntity[]>;

  @CreateDateColumn()
  createdAt!: Date;
}
