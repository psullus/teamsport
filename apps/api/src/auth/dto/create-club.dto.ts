import { IsNotEmpty } from 'class-validator';

export class CreateClubDto {
  @IsNotEmpty()
  name!: string;
}
