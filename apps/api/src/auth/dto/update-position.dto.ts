import { IsOptional, IsString } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  position?: string | null;
}
