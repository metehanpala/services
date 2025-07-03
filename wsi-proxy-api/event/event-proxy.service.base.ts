import { Observable } from 'rxjs';

import { ConnectionState, ValidationInput } from '../shared/data.model';
import { WSIEvent } from './data.model';

/**
 * Base class for the event service.
 * Provides the functionality to read events from WSI.
 *
 * @export
 * @abstract
 * @class EventBase
 */
export abstract class EventProxyServiceBase {

  /**
   * get wsi events array.
   *
   * @abstract
   * @returns { Observable<WSIEvent[]> }
   *
   * @memberOf EventProxyServicBase
   */
  public abstract getEvents(): Observable<WSIEvent[]>;

  /**
   * subscribe to event notifications.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf EventProxyServicBase
   */
  public abstract subscribeEvents(hiddenEvents?: boolean): Observable<boolean>;

  /**
   * Unsubscribe to event notifications.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf EventProxyServicBase
   */
  public abstract unsubscribeEvents(): Observable<boolean>;

  /**
   * Events for the event notifications.
   *
   * @abstract
   * @returns { Observable<WSIEvent[]> }
   *
   * @memberOf EventProxyServicBase
   */
  public abstract eventsNotification(): Observable<WSIEvent[]>;

  /**
   * send the specified command for the specified events: in case of more than one event the bulkcommand api is used
   *
   * @abstract
   * @returns { void> }
   *
   * @memberOf EventProxyServicBase
   */
  public abstract postCommand2Events(eventId: string[], commandId: string, treatmentType?: string, validationInput?: ValidationInput): Observable<boolean>;

  /**
   * Notify about the connection state
   *
   * @abstract
   * @returns { Observable<ConnectionState> }
   *
   * @memberOf EventProxyServicBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;

  /**
   * Get the time offset between server and client in milliseconds
   *
   * @abstract
   * @returns { Observable<number> }
   *
   * @memberOf EventProxyServicBase
   */
  public abstract serverClientTimeDiff(isoString: string): Observable<any>;
}
