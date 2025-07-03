import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';

import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { SystemInfo, SystemsResponseObject } from '../wsi-proxy-api/systems/data.model';
import { SystemsProxyServiceBase } from '../wsi-proxy-api/systems/systems-proxy.service.base';
import { SystemsServiceBase } from './systems.service.base';

/**
 * Systems service.
 * Provides the functionality to read and subscribe to Systems Info
 *
 * @export
 * @class SystemsService
 * @implements {SystemsService}
 */
@Injectable({
  providedIn: 'root'
})
export class SystemsService implements SystemsServiceBase {

  public subscribedSystems: BehaviorSubject<SystemInfo[] | undefined> = new BehaviorSubject<SystemInfo[] | undefined>(undefined);
  private gotDisconnected = false;
  private isSubscribed = false;

  public constructor(
    private readonly trace: TraceService,
    private readonly systemsProxyService: SystemsProxyServiceBase) {
    this.trace.info(TraceModules.systems, 'SystemsService created.');
    this.systemsProxyService.systemsNotification().subscribe(systemsInfo => this.onSystemsNotification(systemsInfo));
    this.systemsProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
  }

  public getSystemsExt(): Observable<SystemsResponseObject> {
    this.trace.info(TraceModules.systems, 'SystemsService.getSystemsExt() called.');
    return this.systemsProxyService.getSystemsExt();
  }

  public getSystems(): Observable<SystemInfo[]> {
    this.trace.info(TraceModules.systems, 'SystemsService.getSystems() called.');
    return this.systemsProxyService.getSystems();
  }

  public getSystem(systemId: any): Observable<SystemInfo> {
    this.trace.info(TraceModules.systems, 'SystemsService.getSystem(systemId) called.');
    return this.systemsProxyService.getSystem(systemId);
  }

  public getSystemLocal(): Observable<SystemInfo> {
    this.trace.info(TraceModules.systems, 'SystemsService.getSystemLocal() called.');
    return this.systemsProxyService.getSystemLocal();
  }

  public subscribeSystems(): Observable<boolean> {
    this.isSubscribed = true;
    this.trace.info(TraceModules.systems, 'SystemsService.subscribeSystems() called.');
    return this.systemsProxyService.subscribeSystems();
  }

  public unSubscribeSystems(): Observable<boolean> {
    this.isSubscribed = false;
    this.trace.info(TraceModules.systems, 'systemsProxyService.unSubscribeSystems() called.');
    return this.systemsProxyService.unSubscribeSystems();
  }

  public systemsNotification(): Observable<SystemInfo[]> | any {
    if (this.subscribedSystems == undefined) {
      this.subscribedSystems = new BehaviorSubject<SystemInfo[] | undefined>(undefined);
    }
    return this.subscribedSystems.asObservable();
  }

  private onSystemsNotification(systemsInfo: SystemInfo[]): void {
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
      if (this.isSubscribed) {
        this.systemsProxyService.subscribeSystems();
      }
    }
  }
}
