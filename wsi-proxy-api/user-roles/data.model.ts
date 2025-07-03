/* eslint-disable @typescript-eslint/naming-convention */
export interface UserRole {
  // User role data
  RoleId: number;
  RoleState: boolean;
  RoleName: string;
  RoleDescription: string;
}

export interface UserAccount {
  UserName: string;
  AccountType: string;
  OpenIdUri: {
    Login: string;
    Logout: string;
  };
}

// export interface UserRolesSubscription {

// }

export interface WsiUserRolesRes {
  RolesMapping: UserRole[];
}

/* eslint-disable @typescript-eslint/naming-convention */
