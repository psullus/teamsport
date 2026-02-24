import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateTeamDto {
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  clubId!: string;
}
