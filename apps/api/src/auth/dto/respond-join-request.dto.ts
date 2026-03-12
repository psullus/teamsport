import { IsIn } from 'class-validator';

export class RespondJoinRequestDto {
  @IsIn(['approved', 'rejected'])
  status!: string;
}
