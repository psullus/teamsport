import { IsIn } from 'class-validator';
import { ROLES } from '@teamsport/shared';
import type { Role } from '@teamsport/shared';

export class ChangeRoleDto {
  @IsIn(Object.values(ROLES))
  role!: Role;
}
