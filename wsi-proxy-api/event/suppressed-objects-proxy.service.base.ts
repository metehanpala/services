import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { EventCounter, SuppressedObjects } from './data.model';

/**
 * Base class for a SuppressedObjects service.
 * See the WSI documentation for details.
 */
export abstract class SuppressedObjectsProxyServiceBase {

  /**
   * Subscribes for all SuppressedObjects of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SuppressedObjectsBase
   */
  public abstract subscribeSuppressedObjects(): Observable<boolean>;

  /**
   * Unsubscribe all SuppressedObjects of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SuppressedObjectsBase
   */
  public abstract unSubscribeSuppressedObjects(): Observable<boolean>;

  /**
   * Event for the SuppressedObjects notifications.
   *
   * @abstract
   * @returns {Observable<SuppressedObjects>}
   *
   * @memberOf SuppressedObjectsBase
   */
  public abstract suppressedObjectsNotification(): Observable<SuppressedObjects>;

  /**
   * Notify about the connection state
   *
   * @abstract
   * @returns {Observable<ConnectionState>}
   *
   * @memberOf EventProxyServicBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
