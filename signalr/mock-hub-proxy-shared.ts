import { HubProxyEvent } from './hub-proxy-event';
import { MockHubConnection } from './mock-hub-connection';

export class MockHubProxyShared {
  public proxies: HubProxyEvent<any>[] = [];

  constructor(public hubConnection: MockHubConnection, private readonly hubName?: string) {
  }

  public registerEventHandler(eventHandler: HubProxyEvent<any>): void {
    this.proxies.push(eventHandler);
  }

  public get connectionId(): string {
    return this.hubConnection.connectionId;
  }
}
