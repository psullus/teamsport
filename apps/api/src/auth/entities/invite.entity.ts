import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import { UserEntity } from './user.entity';

@Entity('invites')
export class InviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ unique: true })
  token!: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  organisation!: OrganisationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  invitedBy!: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
}
