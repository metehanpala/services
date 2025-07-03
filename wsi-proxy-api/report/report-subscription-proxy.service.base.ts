import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { ReportHistoryResult } from './data.model';

/**
 * Base class for the report subscription proxy service.
 */
export abstract class ReportSubscriptionProxyServiceBase {

  /**
   * subscribe to report notifications.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf ReportSubscriptionProxyServiceBase
   */
  public abstract subscribeReport(systemId: number, objectId: string, reportExecutionId: string): Observable<boolean>;

  /**
   * Subscribe to the WSI for this nodeId.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf ReportSubscriptionServiceBase
   */
  public abstract subscribeWsi(systemId: number, objectId: string): Observable<boolean>;

  /**
   * Unsubscribe from Wsi.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf ReportSubscriptionServiceBase
   */
  public abstract unsubscribeWsi(systemId: number, reportDefinitionId?: string): Observable<boolean>;

  /**
   * Unsubscribe to report notifications.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf ReportSubscriptionProxyServiceBase
   */
  public abstract unsubscribeReport(reportExecutionId: string, systemId: number): Observable<boolean>;

  public abstract reportNotification(): Observable<ReportHistoryResult>;

  /**
   * Notify about the connection state
   *
   * @abstract
   * @returns { Observable<ConnectionState> }
   *
   * @memberOf ReportSubscriptionProxyServiceBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
