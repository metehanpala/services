import { TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../shared/trace-modules';
import { HubConnection } from './hub-connection';
import { HubProxyEvent } from './hub-proxy-event';

export class HubProxyShared {

  private readonly hubProxy: SignalR.Hub.Proxy;

  constructor(private readonly trace: TraceService, public hubConnection: HubConnection | undefined, private readonly hubName: string) {
    this.hubProxy = hubConnection?.getHubProxy(hubName);
    this.trace.info(TraceModules.signalR, 'HubProxyShared created for hub: %s', hubName);
  }

  public registerEventHandler(eventHandler: HubProxyEvent<any>): void {
    if (this.hubProxy) {
      this.hubProxy.on(eventHandler.eventHandlerName, (eventArgs: any) => {
        return eventHandler.notifyEvents(eventArgs);
      });
      this.trace.info(TraceModules.signalR, 'Event handler created for hub: %s and event handler name: %s', this.hubName, eventHandler.eventHandlerName);
    } else {
      this.trace.info(TraceModules.signalR, 'hubProxy is undefined. Unable to register event handler.', this.hubName, eventHandler.eventHandlerName);
    }
  }

  public get connectionId(): string {
    return this.hubProxy.connection.id;
  }
}
