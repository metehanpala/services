import { Observable } from 'rxjs';

import { ConnectionState, SubscriptionDeleteWsi, SubscriptionGmsVal, ValueDetails } from '../shared/data.model';

/**
 * Base class for the value subscription service.
 * See WSI API documentation (Value Service) for details.
 */
export abstract class ValueSubscriptionProxyServiceBase {

  /**
   * Subscribes the specified object ids. See WSI API for details.
   * Important: This API can return the subscription objects in multiple replies!!!
   *
   * @abstract
   * @param {string[] } objectOrPropertyIds
   * @param {boolean } [details]
   * @param {string } [clientId] used to dispatch value notifications to the correct client.
   * If not specified, the subscription runs on the "defaultClient".
   * @returns {Observable<any[]>}
   *
   * @memberOf ValueSubscriptionServiceBase
   */
  public abstract subscribeValues(objectOrPropertyIds: string[], details?: boolean,
    booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): Observable<SubscriptionGmsVal[]>;

  /**
   * Unsubscribes objectOrPropertyIds (associated with the subscription keys). See WSI API for details
   *
   * @abstract
   * @param {number[] } keys Subscription keys
   * @param {string } [clientId].
   * @returns {Observable<SubscriptionDeleteWsi[]>}
   *
   * @memberOf ValueSubscriptionServiceBase
   */
  public abstract unsubscribeValues(keys: number[]): Observable<SubscriptionDeleteWsi[]>;

  /**
   * Event for the value notifications.
   *
   * @abstract
   * @param {string } [clientId] used to listen to the value notifications of the specified client.
   * @returns {Observable<ValueDetails[]>}
   *
   * @memberOf ValueSubscriptionServiceBase
   */
  public abstract valueChangeNotification(): Observable<ValueDetails[]>;

  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
