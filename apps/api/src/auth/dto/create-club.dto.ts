import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { SPORT_TYPES } from '@teamsport/shared';

export class CreateClubDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsIn([...SPORT_TYPES])
  type?: string;
}
