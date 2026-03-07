import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
  Relation,
} from 'typeorm';
import type { ClubEntity } from './club.entity';
import type { UserEntity } from './user.entity';

@Entity('club_memberships')
@Unique(['user', 'club'])
export class ClubMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne('UserEntity', 'clubMemberships', { onDelete: 'CASCADE' })
  user!: Relation<UserEntity>;

  @ManyToOne('ClubEntity', 'memberships', { onDelete: 'CASCADE' })
  club!: Relation<ClubEntity>;

  @Column({ type: 'varchar', nullable: true })
  position!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
