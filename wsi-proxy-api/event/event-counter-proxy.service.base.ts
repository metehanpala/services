import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { EventCounter, EventCounterList } from './data.model';

/**
 * Base class for a event counter service.
 * See the WSI documentation for details.
 */
export abstract class EventCounterProxyServiceBase {

  /**
   * Gets all event counters for all categories of the system.
   *
   * @abstract
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterBase
   */
  public abstract getEventCountersAll(): Observable<EventCounterList>;

  /**
   * Gets the event counters for the specified category Id
   *
   * @abstract
   * @param {number } categoryId
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterBase
   */
  public abstract getEventCounters(categoryId: number): Observable<EventCounter>;

  /**
   * Subscribes for all event counters of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventCounterBase
   */
  public abstract subscribeEventCounters(hiddenEvents?: boolean): Observable<boolean>;

  /**
   * Unsubscribe all event counters of the system.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventCounterBase
   */
  public abstract unSubscribeEventCounters(): Observable<boolean>;

  /**
   * Event for the event counter notifications.
   *
   * @abstract
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterBase
   */
  public abstract eventCountersNotification(): Observable<EventCounterList>;

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
