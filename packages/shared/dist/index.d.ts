/** Standard user within an organisation */
export declare const USER: "USER";
/** Organisation administrator */
export declare const ADMIN: "ADMIN";
/** Overall system access */
export declare const CONTROL: "CONTROL";
export declare const ROLES: {
    readonly USER: "USER";
    readonly ADMIN: "ADMIN";
    readonly CONTROL: "CONTROL";
};
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
