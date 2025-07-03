import { Observable } from 'rxjs';

import { ConnectionState, SubscriptionDeleteWsi } from '../shared/data.model';
import { PropertyCommand, SubscriptionGmsCmd } from './data.model';

/**
 * Base class for the command subscription proxy service.
 * See WSI API documentation (Value Service) for details.
 */
export abstract class CommandSubscriptionProxyServiceBase {

  /**
   * Subscribes for Command Changes for the specified property ids.
   * See WSI API documentation (Command Service) for details.
   *
   * @abstract
   * @param {string[]} propertyIds Array of Properties from POST data, which will be subscribed for Command Change notification
   * @returns {Observable<any[]>}
   *
   * @memberOf CommandSubscriptionServiceBase
   */
  public abstract subscribeCommands(propertyIds: string[], booleansAsNumericText?: boolean): Observable<SubscriptionGmsCmd[]>;

  /**
   * Unsubscribes propertyIds (associated with the subscription keys). See WSI API for details
   *
   * @abstract
   * @param {number[]} keys Subscription keys
   * @returns {Observable<SubscriptionDeleteWsi[]>}
   *
   * @memberOf CommandSubscriptionServiceBase
   */
  public abstract unSubscribeCommands(keys: number[]): Observable<SubscriptionDeleteWsi[]>;

  /**
   * Event for the command notifications.
   *
   * @abstract
   * @returns {Observable<PropertyCommand[]>}
   *
   * @memberOf CommandSubscriptionServiceBase
   */
  public abstract commandChangeNotification(): Observable<PropertyCommand[]>;

  /**
   * Event vor the connection state notification.
   *
   * @abstract
   * @returns {Observable<ConnectionState>}
   * @memberof CommandSubscriptionProxyServiceBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
