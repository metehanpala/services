/* eslint-disable @typescript-eslint/naming-convention */
import { inject, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { UserRolesServiceProxyBase } from '../public-api';
import { UserRolesService } from './user-roles.service';
import { UserRolesServiceProxy } from './user-roles.service-proxy';
import { userAccount, userRoles, wsiUserRoles } from './user-roles.test.models';

describe('UserRolesService', () => {
  let service: UserRolesService;
  let proxyServiceSpy: jasmine.SpyObj<UserRolesServiceProxy>;

  beforeEach(() => {
    const spyProxyService = jasmine.createSpyObj('UserRolesServiceProxy', [
      'getUserRoles',
      'updateUserRoles',
      'subscribeUserRoles',
      'userRolesNotification',
      'unsubscribeUserRoles',
      'userRolesNotification'
    ]);
    spyProxyService.getUserRoles.and.returnValue(of(wsiUserRoles));
    spyProxyService.updateUserRoles.and.returnValue(of(userAccount));
    spyProxyService.subscribeUserRoles = (): Observable<boolean> => of(true);
    spyProxyService.userRolesNotification = (): Observable<void> => of(undefined);
    spyProxyService.unsubscribeUserRoles = (): Observable<boolean> => of(true);

    TestBed.configureTestingModule({ providers: [
      UserRolesService,
      { provide: UserRolesServiceProxyBase, useValue: spyProxyService }
    ] }).compileComponents();

  });

  it('getUserRoles should return user roles',
    (inject([UserRolesService, UserRolesServiceProxyBase], (userRoleService: any, userRoleProxyService: any) => {
      userRoleService.getUserRoles().subscribe((result: any) => {
        expect(result).toEqual(userRoles);
      });
    })));

  it('updateUserRoles should return user account',
    (inject([UserRolesService, UserRolesServiceProxyBase], (userRoleService: any, userRoleProxyService: any) => {
      userRoleService.updateUserRoles(userRoles).subscribe((result: any) => {
        expect(result).toEqual(userAccount);
      });
    })));

  it('subscribeUserRoles should return true Observable',
    (inject([UserRolesService, UserRolesServiceProxyBase], (userRoleService: any, userRoleProxyService: any) => {
      userRoleService.subscribeUserRoles().subscribe((result: any) => {
        expect(result).toEqual(true);
      });
    })));

  it('unsubscribeUserRoles should return true Observable',
    (inject([UserRolesService, UserRolesServiceProxyBase], (userRoleService: any, userRoleProxyService: any) => {
      userRoleService.unsubscribeUserRoles().subscribe((result: any) => {
        expect(result).toEqual(true);
      });
    })));

});
