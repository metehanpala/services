import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { EventSoundWsi, ResoundCategory } from './data.model';

/**
 * Base class for the event category sound service.
 * Provides the functionality to read and subscribe to sound for events.
 *
 * @export
 * @abstract
 * @class EventSoundProxyServiceBase
 */
export abstract class EventSoundProxyServiceBase {

  /**
   * Gets the current sound for the event.
   *
   * @abstract
   * @returns {Observable<EventSound>}
   *
   * @memberOf EventSoundProxyServiceBase
   */
  public abstract getCurrentSound(): Observable<EventSoundWsi>;

  /**
   * Subscribes for changes of event sound.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventSoundProxyServiceBase
   */
  public abstract subscribeEventSound(disableCategories?: string[], resoundData?: ResoundCategory[]): Observable<boolean>;

  /**
   * Unsubscribe for changes of event sound.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventSoundProxyServiceBase
   */
  public abstract unSubscribeEventSound(): Observable<boolean>;

  /**
   * Event sound notifications.
   *
   * @abstract
   * @returns {Observable<EventSound>}
   *
   * @memberOf EventSoundProxyServiceBase
   */
  public abstract eventSoundNotification(): Observable<EventSoundWsi>;

  /**
   * Notify about the connection state
   *
   * @abstract
   * @returns {Observable<ConnectionState>}
   *
   * @memberOf EventProxyServicBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;

  /**
   * Reset timer sound
   * @returns {Observable<EventSound>}
   *
   * @memberOf EventSoundServiceBase
   */
  public abstract resetResoundTimer(): Observable<boolean>;
}
