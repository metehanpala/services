import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';

import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { ServiceRequestInfo, ServiceRequestSubscriptionModel } from '../wsi-proxy-api/systems/data.model';
import { SystemsServicesProxyServiceBase } from '../wsi-proxy-api/systems/systems-services-proxy.service.base';
import { SystemsServicesServiceBase } from './systems-services.service.base';

/**
 * Systems service.
 * Provides the functionality to read and subscribe to Systems Info
 *
 * @export
 * @class SystemsServicesService
 * @implements {SystemsServicesService}
 */
@Injectable({
  providedIn: 'root'
})
export class SystemsServicesService implements SystemsServicesServiceBase {

  public subscribedSystems: BehaviorSubject<ServiceRequestInfo | undefined> = new BehaviorSubject<ServiceRequestInfo | undefined>(undefined);
  private gotDisconnected = false;
  private isServicesSubscribed = false;
  private serviceRequestObject: ServiceRequestSubscriptionModel[] | undefined;

  public constructor(
    private readonly trace: TraceService,
    private readonly systemsServicesProxyService: SystemsServicesProxyServiceBase) {
    this.trace.info(TraceModules.systems, 'SystemsService created.');
    this.systemsServicesProxyService.systemsNotification().subscribe(systemsInfo => this.onSystemsNotification(systemsInfo));
    this.systemsServicesProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
  }

  public subscribeSystemsServices(serviceRequestObject: ServiceRequestSubscriptionModel[]): Observable<boolean> {
    this.isServicesSubscribed = true;
    this.serviceRequestObject = serviceRequestObject;
    this.trace.info(TraceModules.systems, 'SystemsService.subscribeServices() called.');
    return this.systemsServicesProxyService.subscribeSystemService(serviceRequestObject);
  }

  public unSubscribeSystemsServices(): Observable<boolean> {
    this.isServicesSubscribed = false;
    this.trace.info(TraceModules.systems, 'systemsServicesProxyService.unSubscribeServices() called.');
    return this.systemsServicesProxyService.unSubscribeSystemService();
  }

  public systemsNotification(): Observable<ServiceRequestInfo> | any {
    if (this.subscribedSystems == undefined) {
      this.subscribedSystems = new BehaviorSubject<ServiceRequestInfo | undefined>(undefined);
    }
    return this.subscribedSystems.asObservable();
  }

  private onSystemsNotification(systemsInfo: ServiceRequestInfo): void {
    if (this.trace.isDebugEnabled(TraceModules.systems)) {
      this.trace.debug(TraceModules.systems, 'SystemsService.onSystemsNotification() called');
    }
    this.subscribedSystems.next(systemsInfo);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.trace.info(TraceModules.systems, 'SystemsService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.trace.info(TraceModules.systems,
        'SystemsService.onNotifyConnectionState(): Connection reestablished');
      this.gotDisconnected = false;
      if (this.isServicesSubscribed) {
        this.systemsServicesProxyService.subscribeSystemService(this.serviceRequestObject);
      }
    }
  }
}
