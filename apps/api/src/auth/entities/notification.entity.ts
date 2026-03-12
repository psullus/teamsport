import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import type { UserEntity } from './user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne('UserEntity', { onDelete: 'CASCADE' })
  user!: Relation<UserEntity>;

  @Column({ type: 'varchar' })
  message!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ default: false })
  read!: boolean;

  @Column({ type: 'uuid', nullable: true })
  referenceId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
