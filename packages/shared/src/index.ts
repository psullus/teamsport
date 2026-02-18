/** Standard user within an organisation */
export const USER = 'USER' as const;
/** Organisation administrator */
export const ADMIN = 'ADMIN' as const;
/** Overall system access */
export const CONTROL = 'CONTROL' as const;

export const ROLES = { USER, ADMIN, CONTROL } as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface Organisation {
  id: string;
  name: string;
}

export interface User {
  id: string;
  organisationName: string;
  organisationId: string;
  email: string;
  emailVerified: boolean;
  role: Role;
}
