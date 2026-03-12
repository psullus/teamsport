import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import type { UserEntity } from './user.entity';
import type { ClubEntity } from './club.entity';

@Entity('organisations')
export class OrganisationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany('UserEntity', 'organisation')
  users!: Relation<UserEntity[]>;

  @OneToMany('ClubEntity', 'organisation')
  clubs!: Relation<ClubEntity[]>;

  @Column({ type: 'text', nullable: true })
  homeMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
