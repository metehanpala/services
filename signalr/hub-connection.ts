import { Injectable, NgZone } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { signalRTraceModuleName } from './signalr.service';

// eslint-disable-next-line
declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class HubConnection {

  public connectionStarted: Subject<boolean> = new Subject<boolean>();
  private readonly _connected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly _disconnected: Subject<boolean> = new Subject<boolean>();
  private readonly _connectionState: BehaviorSubject<SignalR.ConnectionState> =
    new BehaviorSubject<SignalR.ConnectionState>(SignalR.ConnectionState.Disconnected);
  private readonly errorSubject: Subject<SignalR.ConnectionError> = new Subject<SignalR.ConnectionError>();
  private hubConnection: SignalR.Hub.Connection | undefined;

  private static convertState(state: number): string {
    if (state === SignalR.ConnectionState.Connecting) {
      return 'Connecting';
    } else if (state === SignalR.ConnectionState.Connected) {
      return 'Connected';
    } else if (state === SignalR.ConnectionState.Reconnecting) {
      return 'Reconnecting';
    } else if (state === SignalR.ConnectionState.Disconnected) {
      return 'Disconnected';
    } else {
      return 'Unknown';
    }
  }

  public get connectionState(): Observable<SignalR.ConnectionState> | any {
    return this._connectionState.asObservable();
  }

  public get connectionStateValue(): SignalR.ConnectionState {
    return this._connectionState.getValue();
  }

  public get connectionStateValueText(): string {
    return HubConnection.convertState(this._connectionState.getValue());
  }

  public get isDisconnected(): boolean {
    return this._connectionState.getValue() === SignalR.ConnectionState.Disconnected ? true : false;
  }

  public get isConnected(): boolean {
    return this._connectionState.getValue() === SignalR.ConnectionState.Connected ? true : false;
  }

  public get connected(): Observable<boolean> {
    return this._connected.asObservable();
  }

  public get disconnected(): Observable<boolean> {
    return this._disconnected.asObservable();
  }

  constructor(public trace: TraceService, private readonly ngZone: NgZone) {
  }

  public initHubConnection(url: string, accessToken: any): void {
    this.trace.info(TraceModules.signalR, 'initHubConnection() called for url: %s', url);
    const errMsg = 'The variable \'$\' or the .hubConnection() function are not defined; Please check the SignalR scripts have been loaded properly';

    try {
      if ($ === undefined || $.hubConnection === undefined) {
        this.trace.error(TraceModules.signalR, errMsg);
        throw new Error(errMsg);
      }
    } catch (error) {
      this.trace.error(TraceModules.signalR, errMsg);
      throw new Error(errMsg);
    }

    this.hubConnection = $.hubConnection();
    this.hubConnection!.url = url;
    this.hubConnection!.qs = { 'access_token': accessToken }; // $.connection.hub.qs = { 'access_token': <bearer token> };

    // enable in case of debugging
    this.hubConnection!.logging = (this.trace.traceSettings.isVendorModuleEnabled(signalRTraceModuleName) || this.trace.traceSettings.allModulesEnabled);

    this.hubConnection?.stateChanged((state: SignalR.StateChanged) => {
      this.ngZone.run(() => {
        this.trace.info(TraceModules.signalR, 'HubConnection: hub connection state changed; url: %s; old state: %s; new state: %s; id: %s',
          this.hubConnection?.url, HubConnection.convertState(state.oldState),
          HubConnection.convertState(state.newState), this.hubConnection?.id);

        this._connectionState.next(state.newState);
        if (state.newState === SignalR.ConnectionState.Connected) {
          this._connected.next(true);
        } else {
          this._connected.next(false);
        }
        if (state.newState === SignalR.ConnectionState.Disconnected) {
          this._disconnected.next(true);
        } else {
          this._disconnected.next(false);
        }
      });
    });

    this.hubConnection?.connectionSlow(() => {
      this.trace.info(TraceModules.signalR, 'Connection slow!');
    });

    this.hubConnection?.error((error: SignalR.ConnectionError) => {
      this.errorSubject.next(error);
    });
  }

  public getHubProxy(hubName: string): any {
    this.trace.info(TraceModules.signalR,
      'HubConnection:getHubProxy() called for url: %s; hubName: %s', this.hubConnection?.url, hubName);

    const name: string = hubName.toLowerCase(); // signalr creates creates proxies with lowser case names!
    if (this.hubConnection?.proxies[name] == undefined) {
      this.trace.info(TraceModules.signalR,
        'HubConnection:getHubProxy() jquery hubproxy created new hub for url: %s; hubName: %s',
        this.hubConnection?.url, hubName);
      this.hubConnection?.createHubProxy(name);
    }
    return this.hubConnection?.proxies[name];
  }

  public get connectionId(): string | undefined {
    return this.hubConnection?.id;
  }

  public startHubConnection(): void {
    this.ngZone.runOutsideAngular(() => {
      this.trace.info(TraceModules.signalR, 'HubConnection:startHubConnection() called for url: %s; current state: %s',
        this.hubConnection?.url, HubConnection.convertState(this._connectionState.getValue()));

      if (this._connectionState.getValue() !== SignalR.ConnectionState.Disconnected) {
        this.trace.info(TraceModules.signalR, 'HubConnection:startHubConnection(): no need to start, already about to start or started...');
        return;
      }

      this.hubConnection?.start()
        .done(() => {
          this.trace.info(TraceModules.signalR,
            `HubConnection: connection started successfully for: %s,
                  protocol: %s, reconnectDelay: %s, transportConnectTimeout: %s,
                  disconnectTimeout: %s, reconnectWindow: %s, keepAliveWarnAt: %s`,
            this.hubConnection?.url, this.hubConnection?.clientProtocol, this.hubConnection?.reconnectDelay,
            this.hubConnection?.transportConnectTimeout, this.hubConnection?.disconnectTimeout, this.hubConnection?.reconnectWindow,
            this.hubConnection?.keepAliveWarnAt);
          this.connectionStarted.next(true);
          this.connectionStarted.complete();
        })
        .fail((error: any) => {
          this.trace.warn(TraceModules.signalR, 'HubConnection:connection error for: %s', this.hubConnection?.url);
          this.connectionStarted.error(error);
        });
    });
  }
}
