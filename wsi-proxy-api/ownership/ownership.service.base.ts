import { Observable } from 'rxjs';

import { WsiOwner, WsiOwnership } from '../../public-api';

export abstract class OwnershipServiceBase {

  /**
   * Notifies on ownership changes
   *
   * @abstract
   * @returns {Observable<void>}
   *
   * @memberOf OwnershipServiceBase
   */
  public abstract ownershipNotification(): Observable<void>;

  /**
   * Retrieves ownership data
   * @abstract
   * @returns {Observable<WsiOwner>}
   *
   * @memberOf OwnershipServiceBase
   */
  public abstract fetchOwnership(): Observable<WsiOwner>;

  /**
   * Updates ownership
   * @abstract
   * @returns {Observable<WsiOwnership>}
   *
   * @memberOf OwnershipServiceBase
   */
  public abstract updateOwnership(owner: WsiOwnership): Observable<WsiOwnership>;

  /**
   * Subscribe to WSI ownership changes
   * @abstract
   * @returns {Observable<WsiOwnership>}
   *
   * @memberOf OwnershipServiceBase
   */
  public abstract subscribeOwnership(): Observable<boolean>;

  /**
   * unSubscribe from WSI ownership changes
   * @abstract
   * @returns {Observable<WsiOwnership>}
   *
   * @memberOf OwnershipServiceBase
   */
  public abstract unsubscribeOwnership(): Observable<boolean>;

}
