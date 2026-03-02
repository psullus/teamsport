import { IsEmail, IsIn, IsNotEmpty, MinLength } from 'class-validator';
import { SPORT_TYPES } from '@teamsport/shared';

export class SignupDto {
  @IsNotEmpty()
  organisationName!: string;

  @IsNotEmpty()
  clubName!: string;

  @IsIn([...SPORT_TYPES])
  clubType!: string;

  @IsNotEmpty()
  teamName!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;
}
