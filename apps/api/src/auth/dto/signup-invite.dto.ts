import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupInviteDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  inviteToken!: string;
}
