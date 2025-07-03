import { Injectable, OnDestroy } from '@angular/core';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { UserAccount, UserRole, UserRolesServiceProxyBase, WsiUserRolesRes } from '../wsi-proxy-api';
import { UserRolesServiceProxy } from './user-roles.service-proxy';

@Injectable({
  providedIn: 'root'
})
export class UserRolesService implements OnDestroy {

  private userRolesNotificationWSI: ReplaySubject<void > | null = null;
  private userRolesProxySubscription: Observable<boolean> | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly userRolesProxyService: UserRolesServiceProxyBase
  ) { }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  public getUserRoles(): Observable<UserRole[]> {
    return this.userRolesProxyService.getUserRoles().pipe(map(res => res.RolesMapping));
  }

  public updateUserRoles(roles: UserRole[]): Observable<UserAccount> {
    /* eslint-disable @typescript-eslint/naming-convention */
    const userRolesInfo: WsiUserRolesRes = { RolesMapping: roles };
    /* eslint-disable @typescript-eslint/naming-convention */
    return this.userRolesProxyService.updateUserRoles(userRolesInfo);
  }

  public subscribeUserRoles(): Observable<boolean> {
    if (this.userRolesProxySubscription === null) {
      this.userRolesNotificationWSI = new ReplaySubject(null!);
      this.subscriptions.push(this.userRolesProxyService.userRolesNotification().subscribe(() => this.onUserRolesNotification()));

      this.userRolesProxySubscription = this.userRolesProxyService.subscribeUserRoles();
    }

    return this.userRolesProxySubscription;
  }

  public unsubscribeUserRoles(): Observable<boolean> {
    return this.userRolesProxyService.unsubscribeUserRoles();
  }

  public userRolesNotification(): Observable<void> | any {
    return this.userRolesNotificationWSI?.asObservable();
  }

  private onUserRolesNotification(): void {
    this.userRolesNotificationWSI?.next();
  }
}
