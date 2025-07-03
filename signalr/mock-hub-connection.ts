import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockHubConnection {

  public connectionStarted: Subject<boolean> = new Subject<boolean>();
  private readonly _connected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly _disconnected: Subject<boolean> = new Subject<boolean>();
  private readonly _connectionState: BehaviorSubject<SignalR.ConnectionState> =
    new BehaviorSubject<SignalR.ConnectionState>(SignalR.ConnectionState.Disconnected);

  public get connectionState(): Observable<SignalR.ConnectionState> {
    return this._connectionState as Observable<SignalR.ConnectionState>;
  }

  public get isDisconnected(): boolean {
    return false;
  }

  public get isConnected(): boolean {
    return this._connected.value;
  }

  public get connected(): Observable<boolean> {
    return this._connected as Observable<boolean>;
  }

  public get disconnected(): Observable<boolean> {
    return this._disconnected as Observable<boolean>;
  }

  constructor(public clientId: string) {
  }

  public initHubConnection(url: string): void {
    // no mock action immplemented yet
  }

  public getHubProxy(hubName: string): any {
    // no mock action immplemented yet
    return {};
  }

  public get connectionId(): string {
    return 'TestClientConnectionId';
  }

  public startHubConnection(): void {
    this.connectionStarted.next(true);
    this._connected.next(true);
  }

  public get connectionStateValue(): SignalR.ConnectionState {
    return this._connectionState.getValue();
  }
}
