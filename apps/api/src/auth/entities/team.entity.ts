import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Relation,
} from 'typeorm';
import type { ClubEntity } from './club.entity';
import type { UserEntity } from './user.entity';

@Entity('teams')
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne('ClubEntity', 'teams', { onDelete: 'CASCADE' })
  club!: Relation<ClubEntity>;

  @ManyToMany('UserEntity', 'teams')
  @JoinTable({ name: 'team_members' })
  members!: Relation<UserEntity[]>;

  @CreateDateColumn()
  createdAt!: Date;
}
