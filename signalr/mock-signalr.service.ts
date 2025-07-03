import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { NotifiesPending } from './hub-proxy-event';
import { MockHubConnection } from './mock-hub-connection';
import { MockHubProxyShared } from './mock-hub-proxy-shared';

export const signalRTraceModuleName = 'ms-signalR';

@Injectable({
  providedIn: 'root'
})
export class MockSignalRService {

  private readonly proxies: NotifiesPending[] = [];

  private readonly _norisHubConnection: MockHubConnection = new MockHubConnection('TestClientConnection');
  private readonly _norisHubProxy: MockHubProxyShared = new MockHubProxyShared(this._norisHubConnection, 'TestClientHubName');

  public getNorisHubConnection(): MockHubConnection {
    return this._norisHubConnection;
  }

  public getNorisHubConnectionStatus(): Observable<boolean> {
    return of(true);
  }

  public getNorisHub(): MockHubProxyShared {
    return this._norisHubProxy;
  }

  public registerProxy(proxy: NotifiesPending): void {
    this.proxies.push(proxy);
  }
}
