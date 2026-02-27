import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import type { LeagueEntity } from './league.entity';
import type { ClubEntity } from './club.entity';
import type { TeamEntity } from './team.entity';
import type { GoalEntity } from './goal.entity';

@Entity('fixtures')
export class FixtureEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne('LeagueEntity', { onDelete: 'CASCADE' })
  league!: Relation<LeagueEntity>;

  @ManyToOne('ClubEntity', { nullable: true, onDelete: 'SET NULL' })
  homeClub!: Relation<ClubEntity> | null;

  @ManyToOne('ClubEntity', { nullable: true, onDelete: 'SET NULL' })
  awayClub!: Relation<ClubEntity> | null;

  @ManyToOne('TeamEntity', { nullable: true, onDelete: 'SET NULL' })
  homeTeam!: Relation<TeamEntity> | null;

  @ManyToOne('TeamEntity', { nullable: true, onDelete: 'SET NULL' })
  awayTeam!: Relation<TeamEntity> | null;

  @Column({ type: 'timestamp', nullable: true })
  date!: Date | null;

  @Column({ type: 'int', nullable: true })
  homeScore!: number | null;

  @Column({ type: 'int', nullable: true })
  awayScore!: number | null;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'completed', 'no_show_home', 'no_show_away'],
    default: 'scheduled',
  })
  status!: 'scheduled' | 'completed' | 'no_show_home' | 'no_show_away';

  @OneToMany('GoalEntity', 'fixture')
  goals!: Relation<GoalEntity[]>;

  @CreateDateColumn()
  createdAt!: Date;
}
