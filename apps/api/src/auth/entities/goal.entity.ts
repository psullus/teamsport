import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import type { FixtureEntity } from './fixture.entity';
import type { UserEntity } from './user.entity';

@Entity('goals')
export class GoalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne('FixtureEntity', 'goals', { onDelete: 'CASCADE' })
  fixture!: Relation<FixtureEntity>;

  @ManyToOne('UserEntity', { onDelete: 'CASCADE' })
  scorer!: Relation<UserEntity>;

  @CreateDateColumn()
  createdAt!: Date;
}
