import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
  Relation,
} from 'typeorm';
import type { UserEntity } from './user.entity';

@Entity('join_requests')
@Unique(['user', 'targetType', 'targetId'])
export class JoinRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne('UserEntity', { onDelete: 'CASCADE' })
  user!: Relation<UserEntity>;

  @Column({ type: 'varchar' })
  targetType!: string;

  @Column({ type: 'uuid' })
  targetId!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
