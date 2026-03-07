import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string | null;

  @IsOptional()
  @IsString()
  endTime?: string | null;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  primaryContact?: string | null;

  @IsOptional()
  @IsString()
  secondaryContact?: string | null;

  @IsOptional()
  @IsString()
  hostedByName?: string;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;
}
