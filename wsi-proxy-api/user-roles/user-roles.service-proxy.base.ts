import { Observable } from 'rxjs';

import { HubProxyShared } from '../../public-api';
import { UserAccount, WsiUserRolesRes } from './data.model';

export abstract class UserRolesServiceProxyBase {
  public abstract hubProxyShared: HubProxyShared;
  /**
   * Gets all non mandatory user roles
   * @returns and object containing roles array
   */
  public abstract getUserRoles(): Observable<WsiUserRolesRes>;
  /**
   * Updates an array of user roles
   * @param userRolesInfo
   * @returns UserAccount
   */
  public abstract updateUserRoles(userRolesInfo: WsiUserRolesRes): Observable<UserAccount>;
  /**
   * Subscribes to user role chnages
   * @returns an empty object at the moment
   */
  public abstract subscribeUserRoles(): Observable<any>;
  /**
   * Deletes roles subscription
   * @returns boolean
   */
  public abstract unsubscribeUserRoles(): Observable<boolean>;
  /**
   * User roles changes
   * @returns void
   */
  public abstract userRolesNotification(): Observable<void>;
}
