import { IsUUID } from 'class-validator';

export class CreateGoalDto {
  @IsUUID()
  scorerId!: string;
}
