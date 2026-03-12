import { IsIn, IsUUID } from 'class-validator';

export class CreateJoinRequestDto {
  @IsIn(['club', 'team'])
  targetType!: string;

  @IsUUID()
  targetId!: string;
}
