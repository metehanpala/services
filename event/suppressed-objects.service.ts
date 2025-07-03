import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, Subject, Subscription } from 'rxjs';

import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { SubscriptionWsiSuppressedObjects, SuppressedObjects } from '../wsi-proxy-api/event/data.model';
import { SuppressedObjectsProxyServiceBase } from '../wsi-proxy-api/event/suppressed-objects-proxy.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { SuppressedObjectsServiceBase } from './suppressed-objects.service.base';

/**
 * Implementation for the WSI event counter service.
 * See the WSI API documentation for details.
 *
 * @export
 * @class SuppressedObjectsService
 * @extends {SuppressedObjectsServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class SuppressedObjectsService extends SuppressedObjectsServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventSuppressedObjects: HubProxyEvent<SuppressedObjects> | undefined;
  public hubProxySuppressedObjectsSubs: HubProxyEvent<SubscriptionWsiSuppressedObjects> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();

  private _suppressedObjects: Subject<SuppressedObjects> | undefined = new Subject<SuppressedObjects>();
  private gotDisconnected = false;
  private isSubscribed = false;
  private readonly isFirstInjection = true;
  private allEventSubscription: Subscription | null = null;

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly suppressedObjectsProxyService: SuppressedObjectsProxyServiceBase) {
    super();

    this.traceService.info(TraceModules.events, 'SuppressedObjectsService created.');

    this.suppressedObjectsProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Event for the SuppressedObjects notifications.
   *
   * @returns {Observable<SuppressedObjectsList>}
   *
   * @memberOf SuppressedObjectsProxyService
   */

  public suppressedObjectsNotification(): Observable<SuppressedObjects> {
    if (this._suppressedObjects === undefined) {
      this._suppressedObjects = new Subject<SuppressedObjects>();
    }
    return this._suppressedObjects.asObservable();
  }

  public subscribeSuppressedObjects(): void {
    this.allEventSubscription = this.suppressedObjectsProxyService.suppressedObjectsNotification().subscribe(
      suppressedObjects => this.onSuppressedObjectsNotification(suppressedObjects));

    this.traceService.info(TraceModules.events, 'SuppressedObjectsProxyService.subscribeEventCounters() called.');

    this.suppressedObjectsProxyService.subscribeSuppressedObjects();

    this.isSubscribed = true;
  }

  public unSubscribeSuppressedObjects(): Observable<boolean> {

    if (this.allEventSubscription !== null) {
      this.allEventSubscription.unsubscribe();
      this.allEventSubscription = null;
    }

    this.isSubscribed = false;

    return this.suppressedObjectsProxyService.unSubscribeSuppressedObjects();
  }

  private onSuppressedObjectsNotification(suppressedObjects: SuppressedObjects): void {
    if (this.traceService.isDebugEnabled(TraceModules.events)) {
      this.traceService.debug(TraceModules.eventCounterNotifications, 'SuppressedObjectsProxyService:onSuppressedObjectsNotification():\n' + suppressedObjects);
    }
    this._suppressedObjects?.next(suppressedObjects);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.traceService.info(TraceModules.events, 'SuppressedObjectsService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
      if (this._suppressedObjects !== undefined) {
        const observer: Subject<SuppressedObjects> = this._suppressedObjects;
        this._suppressedObjects = undefined;
        observer.error({ message: 'disconnected' });
      }
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.traceService.info(TraceModules.events, 'SuppressedObjectsService.onNotifyConnectionState(): Connection reestablished');
      this.gotDisconnected = false;
      if (this.isSubscribed) {
        this.suppressedObjectsProxyService.subscribeSuppressedObjects();
      }
    }
  }
}
