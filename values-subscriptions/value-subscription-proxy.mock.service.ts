import { Injectable } from '@angular/core';
import { asapScheduler, interval, Observable, throwError as observableThrowError, of,
  scheduled, Subject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

import { ConnectionState, SubscriptionDeleteWsi, SubscriptionGmsVal, ValueDetails } from '../wsi-proxy-api/shared/data.model';
import { ValueSubscriptionProxyServiceBase } from '../wsi-proxy-api/values-subscriptions/value-subscription-proxy.service.base';

@Injectable({
  providedIn: 'root'
})
export class ValueSubscriptionProxyMockService extends ValueSubscriptionProxyServiceBase {

  public events: Subject<ValueDetails[]> = new Subject<ValueDetails[]>();
  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private connectionState = true;
  private readonly subscriptions: Map<string, Subscription> = new Map<string, Subscription>();
  private readonly wsiReplies: Map<string, SubscriptionGmsVal> = new Map<string, SubscriptionGmsVal>();
  private replyDelay: number | undefined;
  private pendingRepliesSubj: Subject<SubscriptionGmsVal[]>[] = [];
  private pendingReplies: SubscriptionGmsVal[][] = [];

  public constructor() {
    super();
  }

  public setSubcribeReply(subWsi: SubscriptionGmsVal[] | undefined, delaySubs?: number): void {
    this.replyDelay = delaySubs;
    if (subWsi != undefined) {
      subWsi.forEach(sub => {
        this.wsiReplies.set(sub.originalId, sub);
      });
    } else {
      this.wsiReplies.clear();
    }
  }

  public startEmitingValues(objectOrPropertyId: string): void {
    if (this.subscriptions.has(objectOrPropertyId)) {
      return;
    }
    this.subscriptions.set(objectOrPropertyId, interval(100).subscribe(value => this.onTimer(value, objectOrPropertyId)));
  }

  public stopEmitingValues(objectOrPropertyId: string): void {
    const sub: Subscription | undefined = this.subscriptions.get(objectOrPropertyId);
    if (sub != undefined) {
      sub.unsubscribe();
      this.subscriptions.delete(objectOrPropertyId);
    }
  }

  public notifyDisconnect(): void {
    this._notifyConnectionState.next(ConnectionState.Disconnected);
    this.connectionState = false;
  }

  public notifyReconnect(): void {
    this._notifyConnectionState.next(ConnectionState.Reconnecting);
    this.connectionState = true;
    this._notifyConnectionState.next(ConnectionState.Connected);
    this.pendingRepliesSubj.forEach((element, index) => {
      element.next(this.pendingReplies[index]);
      element.complete();
    });
    this.pendingRepliesSubj = [];
    this.pendingReplies = [];
  }

  public subscribeValues(objectOrPropertyIds: string[], details = false, booleansAsNumericText?: boolean): Observable<SubscriptionGmsVal[]> {
    if ((objectOrPropertyIds == null) || (objectOrPropertyIds.length === 0)) {
      return observableThrowError(new Error('Invalid arguments!'));
    }

    if (this.connectionState === true) {
      if (this.wsiReplies.size === 0) {
        if (this.replyDelay != undefined) {
          return observableThrowError(new Error('Reply Failed'), asapScheduler).pipe(delay(this.replyDelay));
        } else {
          return observableThrowError(new Error('Reply Failed'), asapScheduler);
        }
      }

      const subsWsi: SubscriptionGmsVal[] = [];
      objectOrPropertyIds.forEach(id => {
        subsWsi.push(this.wsiReplies.get(id)!);
      });
      if (this.replyDelay != undefined) {
        return of(subsWsi).pipe(delay(this.replyDelay));
      } else {
        return scheduled([subsWsi], asapScheduler);
      }
    } else {
      const subsWsi: SubscriptionGmsVal[] = [];
      objectOrPropertyIds.forEach(id => {
        subsWsi.push(this.wsiReplies.get(id)!);
      });
      const subj: Subject<SubscriptionGmsVal[]> = new Subject<SubscriptionGmsVal[]>();
      this.pendingRepliesSubj.push(subj);
      this.pendingReplies.push(subsWsi);
      return subj.asObservable();
    }
  }

  public valueChangeNotification(): Observable<ValueDetails[]> {
    return this.events;
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  public unsubscribeValues(keys: number[]): Observable<SubscriptionDeleteWsi[]> {
    if ((keys == null) || (keys.length === 0)) {
      return observableThrowError(new Error('Invalid arguments!'));
    }
    const subsDelWsi: SubscriptionDeleteWsi[] = [];
    keys.forEach(key => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subWsi: SubscriptionDeleteWsi = { Key: key, ErrorCode: 0 };
      subsDelWsi.push(subWsi);
    });
    return scheduled([subsDelWsi], asapScheduler);
  }

  private onTimer(counter: number, objectOrPropertyId: string): void {
    this.events.next([this.getValue(counter, objectOrPropertyId)]);
  }

  /* eslint-disable @typescript-eslint/naming-convention */

  private getValue(val: number, objectOrPropertyId: string): ValueDetails {
    return {
      DataType: '',
      ErrorCode: this.wsiReplies.get(objectOrPropertyId)!.errorCode,
      SubscriptionKey: this.wsiReplies.get(objectOrPropertyId)!.key,
      Value: { Value: val.toString(), DisplayValue: val.toString(), Timestamp: '', QualityGood: true, Quality: '' },
      IsArray: false
    };
  }

  /* eslint-enable @typescript-eslint/naming-convention */
}
