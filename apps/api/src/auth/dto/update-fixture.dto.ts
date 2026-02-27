import { IsOptional, IsDateString, IsInt, Min, IsIn } from 'class-validator';

export class UpdateFixtureDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;

  @IsOptional()
  @IsIn(['scheduled', 'completed', 'no_show_home', 'no_show_away'])
  status?: 'scheduled' | 'completed' | 'no_show_home' | 'no_show_away';
}
