import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { ServiceRequestInfo, ServiceRequestSubscriptionModel } from '../systems/data.model';

/**
 * Base class for a systems service.
 * See the WSI documentation for details.
 */
export abstract class SystemsServicesProxyServiceBase {
  /**
   * Subscribes for changes of systems.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SystemsProxyServiceBase
   */
  public abstract subscribeSystemService(serviceRequestObject: ServiceRequestSubscriptionModel[] | undefined): Observable<boolean>;

  /**
   * Unsubscribe for changes of systems.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SystemsProxyServiceBase
   */
  public abstract unSubscribeSystemService(): Observable<boolean>;

  /**
   * Systems notifications.
   *
   * @abstract
   * @returns {Observable<EventSound>}
   *
   * @memberOf SystemsProxyServiceBase
   */
  public abstract systemsNotification(): Observable<ServiceRequestInfo>;

  /**
   * Notify about the connection state
   *
   * @abstract
   * @returns {Observable<ConnectionState>}
   *
   * @memberOf SystemsProxyServiceBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
