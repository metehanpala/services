import { Observable } from 'rxjs';

import { ServiceRequestInfo, ServiceRequestSubscriptionModel } from '../wsi-proxy-api/systems/data.model';

/**
 * Base class for a systems service.
 * See the WSI documentation for details.
 */
export abstract class SystemsServicesServiceBase {

  /**
   * Subscribes for changes of Systems Info.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SystemsServicesServiceBase
   */
  public abstract subscribeSystemsServices(serviceRequestObject: ServiceRequestSubscriptionModel[]): Observable<boolean>;

  /**
   * Unsubscribe for changes of Systems Info.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SystemsServicesServiceBase
   */
  public abstract unSubscribeSystemsServices(): Observable<boolean>;

  /**
   * Systems notifications.
   *
   * @abstract
   * @returns {Observable<EventSound>}
   *
   * @memberOf SystemsServicesServiceBase
   */
  public abstract systemsNotification(): Observable<ServiceRequestInfo>;

}
