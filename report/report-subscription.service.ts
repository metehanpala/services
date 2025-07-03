/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, NgZone } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';

import { ReportHistoryResult, SubscriptionUtility } from '../public-api';
import { TraceModules } from '../shared/trace-modules';
import { ConnectionState } from '../wsi-proxy-api';
import { ReportSubscriptionProxyServiceBase } from '../wsi-proxy-api/report/report-subscription-proxy.service.base';
import { ReportSubscriptionServiceBase } from './report-subscription.service.base';

/**
 * GMS WSI report subscription proxy implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportSubscriptionService extends ReportSubscriptionServiceBase {

  private gotDisconnected = false;
  private systemId = 0;
  private objectId = '';
  private reportExecutionId = '';
  private readonly _subscribedProcedure: Subject<ReportHistoryResult> = new Subject<ReportHistoryResult>();

  public constructor(
    private readonly traceService: TraceService,
    private readonly reportSubscriptionProxyService: ReportSubscriptionProxyServiceBase) {
    super();
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService created.');
    this.reportSubscriptionProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));

    this.reportSubscriptionProxyService.reportNotification().subscribe(
      (value: ReportHistoryResult) => this.onSubscribeNotificationReport(value),
      error => this.traceService.error(TraceModules.historyLog, 'ReportSubscriptionService subscribeReport error: ', error));
  }

  public subscribeWsi(systemId: number, objectId: string): Observable<boolean> {
    this.systemId = systemId;
    this.objectId = objectId;
    return this.reportSubscriptionProxyService.subscribeWsi(systemId, objectId);
  }

  public unsubscribeWsi(systemId: number, reportDefinitionId?: string): Observable<boolean> {
    return this.reportSubscriptionProxyService.unsubscribeWsi(systemId, reportDefinitionId);
  }

  public subscribeReport(systemId: number, objectId: string, reportExecutionId: string): Observable<boolean> {
    this.systemId = systemId;
    this.reportExecutionId = reportExecutionId;
    return this.reportSubscriptionProxyService.subscribeReport(systemId, objectId, reportExecutionId);
  }

  public unsubscribeReport(reportExecutionId: string, systemId: number): Observable<boolean> {
    return this.reportSubscriptionProxyService.unsubscribeReport(reportExecutionId, systemId);
  }

  public reportNotification(): Observable<ReportHistoryResult> {
    return this._subscribedProcedure.asObservable();
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.gotDisconnected = false;
      this.reportSubscriptionProxyService.subscribeWsi(this.systemId, this.objectId);
      this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.onNotifyConnectionState(): Connection reestablished');
    }
  }

  private onSubscribeNotificationReport(val: ReportHistoryResult): void {
    this._subscribedProcedure.next(val);
  }
}
