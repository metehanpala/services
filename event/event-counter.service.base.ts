import { Observable } from 'rxjs';

import { EventCounter, EventCounterList } from '../wsi-proxy-api/event/data.model';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

/**
 * Base class for a event counter service.
 * See the WSI documentation for details.
 */
export abstract class EventCounterServiceBase {

  /**
   * Gets all event counters for all categories of the system.
   *
   * @abstract
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterServiceBase
   */
  public abstract getEventCountersAll(): Observable<EventCounterList>;

  /**
   * Gets the event counters for the specified category Id
   *
   * @abstract
   * @param {number } categoryId
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterServiceBase
   */
  public abstract getEventCounters(categoryId: number): Observable<EventCounter>;

  /**
   * Subscribes for all event counters of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventCounterServiceBase
   */
  public abstract subscribeEventCounters(hiddenEvents?: boolean): void;

  /**
   * Unsubscribe all event counters of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventCounterServiceBase
   */
  public abstract unSubscribeEventCounters(): Observable<boolean>;

  /**
   * Event for the event counter notifications.
   *
   * @abstract
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterServiceBase
   */
  public abstract eventCountersNotification(): Observable<EventCounterList>;

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
