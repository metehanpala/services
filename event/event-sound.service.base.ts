import { Observable } from 'rxjs';

import { ResoundCategory } from '../wsi-proxy-api/event/data.model';
import { EventSound } from './data.model';

/**
 * Base class for the event category sound service.
 * Provides the functionality to read and subscribe to sound for events.
 *
 * @export
 * @abstract
 * @class EventSoundServiceBase
 */
export abstract class EventSoundServiceBase {

  /**
   * Gets the current sound for the event.
   *
   * @abstract
   * @returns {Observable<EventSound>}
   *
   * @memberOf EventSoundServiceBase
   */
  public abstract getCurrentSound(): Observable<EventSound>;

  /**
   * Subscribes for changes of event sound.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventSoundServiceBase
   */
  public abstract subscribeEventSound(disableCategories?: string[], resoundData?: ResoundCategory[]): Observable<boolean>;

  /**
   * Unsubscribe for changes of event sound.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf EventSoundServiceBase
   */
  public abstract unSubscribeEventSound(): Observable<boolean>;

  /**
   * Event sound notifications.
   *
   * @abstract
   * @returns {Observable<EventSound>}
   *
   * @memberOf EventSoundServiceBase
   */
  public abstract eventSoundNotification(): Observable<EventSound>;

  /**
   * Reset timer sound
   * @returns {Observable<EventSound>}
   *
   * @memberOf EventSoundServiceBase
   */
  public abstract resetResoundTimer(): Observable<boolean>;
}
