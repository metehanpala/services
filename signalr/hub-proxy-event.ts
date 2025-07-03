import { NgZone } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { interval, Observable, Subject } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { HubProxyShared } from './hub-proxy-shared';
import { SignalRService } from './signalr.service';

const instrumentationInterval = 30;

export interface NotifiesPending {
  getPendingNotifies(): number;
}

export class HubProxyEvent<T> implements NotifiesPending {

  private readonly _events: Subject<T> = new Subject<T>();
  private noOfNotifications = 0;
  private noNotifiesPending = 0;

  constructor(public trace: TraceService, public hubProxy: HubProxyShared, public eventHandlerName: string,
    private readonly ngZone: NgZone, signalRService: SignalRService, private readonly filterEvent?: string) {

    signalRService.registerProxy(this);
    hubProxy.registerEventHandler(this);
    this.ngZone.runOutsideAngular(() => {
      interval(instrumentationInterval * 1000).subscribe(value => this.onSignalRInstrumentationTimer(value));
    });
  }

  public getPendingNotifies(): number {
    const noNotifies: number = this.noNotifiesPending;
    this.noNotifiesPending = 0;
    return noNotifies;
  }

  public get connectionId(): string {
    return this.hubProxy.connectionId;
  }

  public get eventChanged(): Observable<T> {
    return this._events.asObservable();
  }

  public notifyEvents(event: T | any): void {
    if (this.filterEvent != undefined) {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      if (event['RequestFor'] === this.filterEvent) {
        this.noOfNotifications++;
        this.noNotifiesPending++;
        this.pushEvent(event);
      }
    } else {
      this.noOfNotifications++;
      this.noNotifiesPending++;
      this.pushEvent(event);
    }
  }

  private pushEvent(event: T): void {
    let start: number | undefined;
    if (this.trace.isDebugEnabled(TraceModules.signalR)) {
      start = performance.now();
    }

    this._events.next(event);

    if (this.trace.isDebugEnabled(TraceModules.signalR)) {
      this.trace.debug(TraceModules.signalR, 'Notified signalR event (%s); Time used: %s [ms]', this.eventHandlerName, performance.now() - start!);
    }
  }

  private onSignalRInstrumentationTimer(counter: number): void {
    if (this.trace.isInfoEnabled(TraceModules.instrumentation)) {
      this.trace.info(TraceModules.instrumentation, '%s: number of notifications = %s per second',
        this.eventHandlerName, (this.noOfNotifications / instrumentationInterval));
    }
    this.noOfNotifications = 0;
  }
}
