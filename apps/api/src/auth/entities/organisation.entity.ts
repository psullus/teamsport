import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('organisations')
export class OrganisationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => UserEntity, (user) => user.organisation)
  users!: UserEntity[];

  @CreateDateColumn()
  createdAt!: Date;
}
