import { IsNotEmpty, IsIn, IsUUID, ValidateIf } from 'class-validator';

export class CreateLeagueDto {
  @IsNotEmpty()
  name!: string;

  @IsIn(['club', 'team'])
  type!: 'club' | 'team';

  @ValidateIf((o) => o.type === 'team')
  @IsUUID()
  clubId?: string;
}
