import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateFixtureDto {
  @IsUUID()
  homeId!: string;

  @IsUUID()
  awayId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
