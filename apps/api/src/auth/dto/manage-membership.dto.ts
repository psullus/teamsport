import { IsUUID } from 'class-validator';

export class ManageMembershipDto {
  @IsUUID()
  userId!: string;
}
