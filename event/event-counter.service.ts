import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { Observable, Subject, Subscription } from 'rxjs';

import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { EventCounter, EventCounterList } from '../wsi-proxy-api/event/data.model';
import { EventCounterProxyServiceBase } from '../wsi-proxy-api/event/event-counter-proxy.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { EventCounterServiceBase } from './event-counter.service.base';

/**
 * Implementation for the WSI event counter service.
 * See the WSI API documentation for details.
 *
 * @export
 * @class EventCounterService
 * @extends {EventCounterServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventCounterService extends EventCounterServiceBase {

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();

  private _eventCounters: Subject<EventCounterList> | undefined = new Subject<EventCounterList>();
  private gotDisconnected = false;
  private isSubscribed = false;
  private readonly isFirstInjection = true;
  private allEventSubscription: Subscription | null = null;

  public constructor(
    private readonly traceService: TraceService,
    private readonly eventCounterProxyService: EventCounterProxyServiceBase) {
    super();

    this.traceService.info(TraceModules.events, 'EventService created.');

    this.eventCounterProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
    this.subscribeEventCounters();
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Gets all event counters for all categories of the system.
   *
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterService
   */
  public getEventCountersAll(): Observable<EventCounterList> {
    return this.eventCounterProxyService.getEventCountersAll();
  }

  /**
   * Gets the event counters for the specified category Id
   *
   * @param {number } categoryId
   * @returns {Observable<EventCounter>}
   *
   * @memberOf EventCounterService
   */
  public getEventCounters(categoryId: number): Observable<EventCounter> {
    return this.eventCounterProxyService.getEventCounters(categoryId);
  }

  /**
   * Event for the event counter notifications.
   *
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterProxyService
   */

  public eventCountersNotification(): Observable<EventCounterList> {
    if (this._eventCounters === undefined) {
      this._eventCounters = new Subject<EventCounterList>();
    }
    return this._eventCounters.asObservable();
  }

  public subscribeEventCounters(hiddenEvents = false): void {
    this.allEventSubscription = this.eventCounterProxyService.eventCountersNotification().subscribe(
      eventCounterList => this.onEventCountersNotification(eventCounterList));

    this.traceService.info(TraceModules.events, 'EventCounterProxyService.subscribeEventCounters() called.');

    this.eventCounterProxyService.subscribeEventCounters(hiddenEvents);

    this.isSubscribed = true;
  }

  public unSubscribeEventCounters(): Observable<boolean> {

    if (this.allEventSubscription !== null) {
      this.allEventSubscription.unsubscribe();
      this.allEventSubscription = null;
    }

    this.isSubscribed = false;

    return this.eventCounterProxyService.unSubscribeEventCounters();
  }

  private onEventCountersNotification(eventCounters: EventCounterList): void {
    let trcStr = `EventCounterService:onEventCountersNotification():
    Total counters=${eventCounters.TotalCounters}; Unprocessed counters=${eventCounters.TotalUnprocessedCounters}`;
    this.traceService.info(TraceModules.eventCounterTiming, trcStr);
    if (this.traceService.isDebugEnabled(TraceModules.eventCounterNotifications)) {
      eventCounters.EventCategoryCounters.forEach(val => {
        trcStr = trcStr + '\n' + `Category=${val.CategoryDescriptor}; Total count=${val.TotalCount}; Unprocessed count=${val.UnprocessedCount}`;
      });
      this.traceService.debug(TraceModules.eventCounterNotifications, 'EventCounterService:onEventCountersNotification():\n' + trcStr);
    }
    this._eventCounters?.next(eventCounters);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    const traceMsg = `EventCountersService.onNotifyConnectionState() state: ${SubscriptionUtility.getTextForConnection(connectionState)}`;
    this.traceService.info(TraceModules.eventCounterTiming, traceMsg);
    this.traceService.info(TraceModules.events, traceMsg);

    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
      if (this._eventCounters !== undefined) {
        const observer: Subject<EventCounterList> = this._eventCounters;
        this._eventCounters = undefined;
        observer.error({ message: 'disconnected' });
      }
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.traceService.info(TraceModules.events, 'EventCountersService.onNotifyConnectionState(): Connection reestablished');
      this.gotDisconnected = false;
      if (this.isSubscribed) {
        this.eventCounterProxyService.subscribeEventCounters();
      }
    }
  }
}
