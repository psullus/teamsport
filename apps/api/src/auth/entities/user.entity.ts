import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ROLES } from '@teamsport/shared';
import type { Role } from '@teamsport/shared';
import { OrganisationEntity } from './organisation.entity';

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

  @ManyToOne(() => OrganisationEntity, (org) => org.users, { onDelete: 'CASCADE' })
  organisation!: OrganisationEntity;

  @CreateDateColumn()
  createdAt!: Date;
}
