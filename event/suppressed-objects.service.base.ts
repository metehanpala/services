import { Observable } from 'rxjs';

import { EventCounter, SuppressedObjects } from '../wsi-proxy-api/event/data.model';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

/**
 * Base class for a SuppressedObjects service.
 * See the WSI documentation for details.
 */
export abstract class SuppressedObjectsServiceBase {

  /**
   * Subscribes for all SuppressedObjects of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SuppressedObjectsServiceBase
   */
  public abstract subscribeSuppressedObjects(): void;

  /**
   * Unsubscribe all SuppressedObjects of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SuppressedObjectsServiceBase
   */
  public abstract unSubscribeSuppressedObjects(): Observable<boolean>;

  /**
   * Event for the SuppressedObjects notifications.
   *
   * @abstract
   * @returns {Observable<SuppressedObjectsList>}
   *
   * @memberOf SuppressedObjectsServiceBase
   */
  public abstract suppressedObjectsNotification(): Observable<SuppressedObjects>;

  /**
   * Notify about the connection state
   *
   * @abstract
   * @returns {Observable<ConnectionState>}
   *
   * @memberOf EventCounterServiceBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
