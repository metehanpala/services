import { Observable } from 'rxjs';

import { ReportHistoryResult } from '../wsi-proxy-api/report/data.model';

/**
 * Base class for the report subscription service.
 * Provides the functionality to create, cancel and subscribe to report.
 *
 * @export
 * @abstract
 * @class ReportSubscriptionServiceBase
 */
export abstract class ReportSubscriptionServiceBase {

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
   * Subscribe only for this reportExecutionId notifications.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf ReportSubscriptionServiceBase
   */
  public abstract subscribeReport(systemId: number, objectId: string, reportExecutionId: string): Observable<boolean>;

  /**
   * Unsubscribe only for this reportExecutionId notifications.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf ReportSubscriptionServiceBase
   */
  public abstract unsubscribeReport(reportExecutionId: string, systemId: number): Observable<boolean>;

  /**
   * Recived notification for report creation.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf ReportSubscriptionServiceBase
   */
  public abstract reportNotification(): Observable<ReportHistoryResult>;
}
