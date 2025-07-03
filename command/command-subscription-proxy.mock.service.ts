import { Injectable } from '@angular/core';
import { asapScheduler, interval, Observable, throwError as observableThrowError, of, scheduled, Subject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

import { CommandSubscriptionProxyServiceBase } from '../wsi-proxy-api/command/command-subscription-proxy.service.base';
import { PropertyCommand, SubscriptionGmsCmd } from '../wsi-proxy-api/command/data.model';
import { ConnectionState, SubscriptionDeleteWsi } from '../wsi-proxy-api/shared/data.model';

@Injectable({
  providedIn: 'root'
})
export class CommandSubscriptionProxyMockService extends CommandSubscriptionProxyServiceBase {

  public events: Subject<PropertyCommand[]> = new Subject<PropertyCommand[]>();
  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private connectionState = true;
  private readonly subscriptions: Map<string, Subscription> = new Map<string, Subscription>();
  private readonly wsiReplies: Map<string, SubscriptionGmsCmd> = new Map<string, SubscriptionGmsCmd>();
  private replyDelay: number | undefined;
  private pendingRepliesSubj: Subject<SubscriptionGmsCmd[]>[] = [];
  private pendingReplies: SubscriptionGmsCmd[][] = [];

  public constructor() {
    super();
  }

  public setSubcribeReply(subWsi: SubscriptionGmsCmd[], delaySubs?: number): void {
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

  public subscribeCommands(propertyIds: string[]): Observable<SubscriptionGmsCmd[]> {
    if ((propertyIds == null) || (propertyIds.length === 0)) {
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

      const subsWsi: SubscriptionGmsCmd[] = [];
      propertyIds.forEach(id => {
        subsWsi.push(this.wsiReplies.get(id)!);
      });
      if (this.replyDelay != undefined) {
        return of(subsWsi).pipe(delay(this.replyDelay));
      } else {
        return scheduled([subsWsi], asapScheduler);
      }
    } else {
      const subsWsi: SubscriptionGmsCmd[] = [];
      propertyIds.forEach(id => {
        subsWsi.push(this.wsiReplies.get(id)!);
      });
      const subj: Subject<SubscriptionGmsCmd[]> = new Subject<SubscriptionGmsCmd[]>();
      this.pendingRepliesSubj.push(subj);
      this.pendingReplies.push(subsWsi);
      return subj.asObservable();
    }
  }

  public commandChangeNotification(): Observable<PropertyCommand[]> {
    return this.events;
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  public unSubscribeCommands(keys: number[]): Observable<SubscriptionDeleteWsi[]> {
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
    this.events.next([this.getCommand(counter, objectOrPropertyId)]);
  }

  /* eslint-disable @typescript-eslint/naming-convention */
  private getCommand(defValue: number, propertyId: string): PropertyCommand {
    return {
      ErrorCode: this.wsiReplies.get(propertyId)!.errorCode!,
      PropertyId: propertyId,
      SubscriptionKey: this.wsiReplies.get(propertyId)!.key!,
      Commands: [{
        Descriptor: '',
        GroupNumber: 0,
        PropertyId: propertyId,
        Id: 'CommandId',
        IsDefault: false,
        Parameters: [{
          DataType: '',
          DefaultValue: defValue.toString(),
          Descriptor: '',
          EnumerationTexts: [],
          Max: '',
          Min: '',
          Name: '',
          Order: 0
        }]
      }]
    };
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}
