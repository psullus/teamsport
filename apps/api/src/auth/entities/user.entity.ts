import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  Relation,
} from 'typeorm';
import { ROLES } from '@teamsport/shared';
import type { Role } from '@teamsport/shared';
import type { OrganisationEntity } from './organisation.entity';
import type { ClubMemberEntity } from './club-member.entity';
import type { TeamEntity } from './team.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: Object.values(ROLES), default: ROLES.ADMIN })
  role!: Role;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarPath!: string | null;

  @ManyToOne('OrganisationEntity', 'users', { onDelete: 'CASCADE' })
  organisation!: Relation<OrganisationEntity>;

  @OneToMany('ClubMemberEntity', 'user')
  clubMemberships!: Relation<ClubMemberEntity[]>;

  @ManyToMany('TeamEntity', 'members')
  teams!: Relation<TeamEntity[]>;

  @CreateDateColumn()
  createdAt!: Date;
}
