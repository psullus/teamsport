export type Role = 'CONTROL' | 'ADMIN' | 'USER';

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
