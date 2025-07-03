import { UserRole, WsiUserRolesRes } from '../wsi-proxy-api';

/* eslint-disable @typescript-eslint/naming-convention */
export const userAccount = {
  UserName: 'string',
  AccountType: 'string',
  OpenIdUri: {
    Login: 'string',
    Logout: 'string'
  }
};
export const userRoles: UserRole[] = [
  {
    RoleId: 12231,
    RoleState: false,
    RoleName: 'My role 1',
    RoleDescription: 'Role description'
  }
];
export const wsiUserRoles: WsiUserRolesRes = { RolesMapping: userRoles };
