import { Injectable, NgZone } from '@angular/core';
import { AppSettings, AppSettingsService, AuthenticationServiceBase, ErrorDisplayItem, ErrorDisplayMode, ErrorDisplayState,
  ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, interval } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { NotifiesPending } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { HubConnection } from './hub-connection';

export const signalRTraceModuleName = 'ms-signalR';

// Time to wait before considering a SignalR connection error as inactive
const debounceTime = 1000;

// The minimal interval for SignalR notifications update
const minimalInterval = 200;

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  // Counter for SignalR instances
  private static counter = 0;

  // To notify consumers hub is ready
  private readonly norisHubConnectionSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Array of proxies for pending notifications
  private readonly proxies: NotifiesPending[] = [];

  // Timestamp for performance tracking
  private timeMilliSec: number = performance.now();

  // SignalR Hub connection instance
  private _norisHubConnection: HubConnection | undefined;

  // SignalR Hub proxy instance
  private _norisHubProxy: HubProxyShared | undefined;

  // Error display item for SignalR connection errors
  private _signalRErrorItem?: ErrorDisplayItem | undefined;

  // Flag indicating if initial connection is done
  private initialConnectionDone = false;

  constructor(
    private readonly appSettingsService: AppSettingsService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly trace: TraceService,
    private readonly ngZone: NgZone,
    private readonly endpoint: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase
  ) {
    // Log creation of SignalR service
    this.trace.info(TraceModules.signalR, 'SignalR service created.');

    // Add SignalR to vendor modules for tracing
    this.trace.traceSettings.addToVendorModules(signalRTraceModuleName);
    this.createNorisHub();

    // Subscribe to login state changes
    this.authenticationServiceBase.loginObservable.subscribe((isLoggedIn: boolean) => {
      this.createNorisHub(isLoggedIn);
    });
  }

  /**
 * Creates Noris Hub If user is authenticated.
 * @returns {HubConnection | undefined} The SignalR Hub connection.
 */
  public createNorisHub(isLoggedIn?: boolean): void {
    if (isLoggedIn || !isNullOrUndefined(this.authenticationServiceBase.userToken)) {
      // Create SignalR connection and proxy when user is logged in
      this.createNorisHubConnection();
      this.getNorisHub();

      // Set up error display item for SignalR connection errors
      this._signalRErrorItem = new ErrorDisplayItem(ErrorDisplayMode.Modal, ErrorDisplayState.Inactive, debounceTime);
      this._signalRErrorItem.setDisplayMessageKey('GMS_SERVICES.CONNECTION_ERROR_MSG');
      this._signalRErrorItem.setDisplayTitleKey('GMS_SERVICES.CONNECTION_ERROR_TITLE');

      // Subscribe to connection state changes and handle errors
      this._norisHubProxy?.hubConnection?.connected.subscribe(value => this.onSignalRConnection(value), error => this.onSignalRConnectionError(error));

      // Set up minimal interval for notifications update
      this.ngZone.runOutsideAngular(() => {
        interval(minimalInterval).subscribe(value => this.onSignalRCDTimer(value));
      });
    } else {
      this.trace.info(TraceModules.signalR, 'User is not logged in, cannot create the SignalR connection');
    }
  }

  /**
 * Gets the SignalR Hub connection.
 * @returns {HubConnection | undefined} The SignalR Hub connection.
 */
  public getNorisHubConnection(): HubConnection | undefined {
    return this._norisHubConnection;
  }

  /**
   * Gets the SignalR Hub proxy.
   * @returns {HubProxyShared} The SignalR Hub proxy.
   */
  public getNorisHub(): HubProxyShared {
    if (!this._norisHubProxy) {
      this._norisHubProxy = new HubProxyShared(this.trace, this._norisHubConnection, 'norisHub');
    }
    return this._norisHubProxy;
  }

  /**
   * Gets the SignalR Hub connection status.
   * @returns {norisHubConnectionSubject} The SignalR Hub connection status subject.
   */
  public getNorisHubConnectionStatus(): BehaviorSubject<boolean> {
    return this.norisHubConnectionSubject;
  }

  /**
     * Registers a proxy for notifying pending changes.
     * @param {NotifiesPending} proxy - The proxy to register.
     * @returns {void}
     */
  public registerProxy(proxy: NotifiesPending): void {
    this.proxies.push(proxy);
  }

  /**
   * Creates a new instance of the SignalR Hub connection.
   * @returns {HubConnection} The newly created SignalR Hub connection.
   */
  private createNorisHubConnection(): void {
    const id = 'Html5_Client';
    const url: string = this.endpoint.entryPoint + '/signalr';

    if (!this._norisHubConnection) {
      this._norisHubConnection = new HubConnection(this.trace, this.ngZone);
      this._norisHubConnection.initHubConnection(url, this.authenticationServiceBase.userToken);
      SignalRService.counter++;
    }
    this.norisHubConnectionSubject.next(true); // Notify consumers connection is established
    this.trace.info(TraceModules.signalR, 'createNorisHubConnection(); hub connection returned; id=%s', id);
  }

  /**
   * Handles the timer for SignalR change detection.
   * @returns {void}
   */
  private onSignalRCDTimer(counter: number): void {
    const valCount = this.proxies.reduce((total, proxy) => total + proxy.getPendingNotifies(), 0);
    if (valCount > 0) {
      const old: number = this.timeMilliSec;
      this.timeMilliSec = performance.now();
      this.ngZone.run(() => {
        this.trace.debug(TraceModules.signalR, 'Trigger change detection for SignalR...; Delta to previous SignalR CD run  %s [ms]', this.timeMilliSec - old);
      });
    }
  }

  /**
   * Handles the SignalR connection state change event.
   * @param {boolean} value - The new connection state value.
   * @returns {void}
   */
  private onSignalRConnection(value: boolean): void {
    this.trace.info(TraceModules.signalR, 'SignalRService.onSignalRConnection(): Connected = %s; State = %s', value,
      this._norisHubConnection?.connectionStateValueText);
    if (this._signalRErrorItem) {
      this.initialConnectionDone = true;
      this._signalRErrorItem.state = value ? ErrorDisplayState.Inactive : ErrorDisplayState.Active;
      if (this.initialConnectionDone) {
        this.errorService.notifyErrorChange(this._signalRErrorItem);
      }
    }
  }

  /**
   * Handles SignalR connection errors.
   * @param {any} error - The error object containing details about the error.
   * @returns {void}
   */
  private onSignalRConnectionError(error: any): void {
    this.trace.error(TraceModules.values, 'SignalRService.onSignalRConnectionError(): %s', error.toString());
  }
}
