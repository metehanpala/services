import { TraceService } from '@gms-flex/services-common';

import { SubscriptionDeleteWsi, SubscriptionGms } from '../../wsi-proxy-api/shared/data.model';
import { GmsSubscription, SubscriptionState } from './gms-subscription';
import { GmsSubscriptionFsm } from './gms-subscription-fsm';
import { SubscriptionUtility } from './subscription-utility';

export enum SubscriptionFsmInputs {
  SubscribeReplySuccess = 0,
  SubscribeReplyFailed = 1,
  NotifyChannelDisconnected = 2,
  NotifyChannelReconnected = 3,
  Unsubscribe = 4,
  UnsubscribeReplySuccess = 5,
  UnsubscribeReplyFailed = 6,
  Subscribe = 7
}

export enum FsmReplyType {
  None = 0,
  DoSubscribe = 1,
  DoUnsubscribe = 2
}

export class GmsSubscriptionFsmReply<T> {
  constructor(public fsmReplyType: FsmReplyType = FsmReplyType.None,
    public subFsmCreated?: GmsSubscriptionFsm<T>,
    public subFsmRemoved?: GmsSubscriptionFsm<T>) {
  }
}

export class GmsSubscriptionFsmInputData<T> {
  constructor(public clientId?: string,
    public toBeUnsubscribed?: GmsSubscription<T>,
    public subscriptionWsi?: SubscriptionGms) {
  }
}

export class GmsSubscriptionShared<T> {

  public gmsId: string | undefined;
  public subscriptionWsi: SubscriptionGms | undefined;
  public latestGmsChange: T | undefined;
  private _state: SubscriptionState = SubscriptionState.Subscribing;
  private readonly _gmsSubscriptionFsms: Map<number, GmsSubscriptionFsm<T>> = new Map<number, GmsSubscriptionFsm<T>>();
  private trace: TraceService | undefined;
  private traceModule: string | undefined;

  public initialize(gmsId: string, trace: TraceService, traceModule: string, clientId: string): GmsSubscriptionFsmReply<T> {
    this.gmsId = gmsId;
    this.trace = trace;
    this.traceModule = traceModule;
    return this.createFirstGmsSubscriptionFsm(clientId);
  }

  public get gmsSubscriptionFsms(): Map<number, GmsSubscriptionFsm<T>> {
    return this._gmsSubscriptionFsms;
  }

  public get isActive(): boolean {
    return ((this._state === SubscriptionState.Subscribing) ||
      (this._state === SubscriptionState.Subscribed) ||
      (this._state === SubscriptionState.ResubscribePending)) ? true : false;
  }

  public get state(): SubscriptionState {
    return this._state;
  }

  public get refCount(): number {
    return this._gmsSubscriptionFsms.size;
  }

  public toString(): string {
    let key = '';
    let errorCode = '';
    if (this.subscriptionWsi?.key != undefined) {
      key = this.subscriptionWsi.key.toString();
    }
    if (this.subscriptionWsi?.errorCode != undefined) {
      errorCode = this.subscriptionWsi.errorCode.toString();
    }
    return `gmsId: ${this.gmsId},
    state: ${SubscriptionUtility.getText(this.state)}, wsiKey: ${key}, wsiErrorCode: ${errorCode}, refCount: ${this.refCount}`;
  }

  public subscribeReply(subscriptionWsi: SubscriptionGms | undefined): GmsSubscriptionFsmReply<T> {
    if ((subscriptionWsi != undefined) && (subscriptionWsi.originalId !== this.gmsId)) {
      this.trace!.error(this.traceModule!,
        'GmsSubscriptionShared.subscribeReply(): gmsId mismatch; shall not reach this condition! Fix needed on the consumer side!');
      return new GmsSubscriptionFsmReply<T>();
    }

    if (subscriptionWsi == undefined) {
      return this.handleStateChange(SubscriptionFsmInputs.SubscribeReplyFailed, new GmsSubscriptionFsmInputData(undefined, undefined, subscriptionWsi))!;
    } else {
      if (this.isSuccess(subscriptionWsi)) {
        return this.handleStateChange(SubscriptionFsmInputs.SubscribeReplySuccess, new GmsSubscriptionFsmInputData(undefined, undefined, subscriptionWsi))!;
      } else {
        return this.handleStateChange(SubscriptionFsmInputs.SubscribeReplyFailed, new GmsSubscriptionFsmInputData(undefined, undefined, subscriptionWsi))!;
      }
    }
  }

  public unsubscribe(gmsSubscription: GmsSubscription<T>): GmsSubscriptionFsmReply<T> | undefined {
    if ((gmsSubscription != undefined) && (gmsSubscription.gmsId !== this.gmsId)) {
      this.trace!.error(this.traceModule!,
        'GmsSubscriptionShared.unsubscribe():  gmsId mismatch; shall not reach this condition! Fix needed on the consumer side!');
      return new GmsSubscriptionFsmReply();
    }

    return this.handleStateChange(SubscriptionFsmInputs.Unsubscribe, new GmsSubscriptionFsmInputData(undefined, gmsSubscription));
  }

  public notifyChannelDisconnected(): void {
    this.handleStateChange(SubscriptionFsmInputs.NotifyChannelDisconnected);
  }

  public notifyChannelReconnected(): GmsSubscriptionFsmReply<T> | undefined {
    return this.handleStateChange(SubscriptionFsmInputs.NotifyChannelReconnected);
  }

  public unsubscribeReply(subscriptionDelWsi: SubscriptionDeleteWsi | undefined): void {
    if ((subscriptionDelWsi != undefined) && (this.subscriptionWsi != undefined) && (subscriptionDelWsi.Key !== this.subscriptionWsi.key)) {
      this.trace!.error(this.traceModule!,
        'GmsSubscriptionShared.unsubscribeReply():  key mismatch; shall not reach this condition! Fix needed on the consumer side!');
      return;
    }

    if ((subscriptionDelWsi != undefined) && this.isSuccessDel(subscriptionDelWsi)) {
      this.handleStateChange(SubscriptionFsmInputs.UnsubscribeReplySuccess);
    } else {
      this.handleStateChange(SubscriptionFsmInputs.UnsubscribeReplyFailed);
    }
  }

  public subscribe(clientId: string): GmsSubscriptionFsmReply<T> | undefined {
    return this.handleStateChange(SubscriptionFsmInputs.Subscribe, new GmsSubscriptionFsmInputData(clientId));
  }

  private handleStateChange(input: SubscriptionFsmInputs, inputData?: GmsSubscriptionFsmInputData<T>): GmsSubscriptionFsmReply<T> | undefined {
    switch (this.state) {
      case SubscriptionState.Subscribing: {
        return this.handleSubscribingState(input, inputData);
      }
      case SubscriptionState.Subscribed: {
        return this.handleSubscribedState(input, inputData);
      }
      case SubscriptionState.Unsubscribing: {
        return this.handleUnsubscribingState(input, inputData);
      }
      case SubscriptionState.Unsubscribed: {
        return this.handleUnsubscribedState(input, inputData);
      }
      case SubscriptionState.ResubscribePending: {
        return this.handleResubscribePendingState(input, inputData);
      }
      default: {
        this.trace!.error(this.traceModule!, 'GmsSubscriptionShared.handleStateChange(): Unhandled state in SubscriptionShared.');
        return undefined;
      }
    }
  }

  private handleSubscribingState(input: SubscriptionFsmInputs, inputData?: GmsSubscriptionFsmInputData<T>): GmsSubscriptionFsmReply<T> | undefined {
    switch (input) {
      case SubscriptionFsmInputs.Subscribe: {
        if (inputData?.clientId) {
          return this.createNewGmsSubscriptionFsm(inputData.clientId);
        } else {
          return undefined;
        }
      }
      case SubscriptionFsmInputs.SubscribeReplySuccess: {
        this.subscriptionWsi = inputData?.subscriptionWsi;
        this.updateGmsSubscriptionsSubscribeReply(inputData?.subscriptionWsi);
        if (this.refCount > 0) {
          this._state = SubscriptionState.Subscribed;
          return new GmsSubscriptionFsmReply();
        } else {
          this._state = SubscriptionState.Unsubscribing;
          return new GmsSubscriptionFsmReply(FsmReplyType.DoUnsubscribe);
        }
      }
      case SubscriptionFsmInputs.SubscribeReplyFailed: {
        this.subscriptionWsi = inputData?.subscriptionWsi;
        this.updateGmsSubscriptionsSubscribeReply(inputData?.subscriptionWsi);
        this.removeAllValueSubscriptions();
        this._state = SubscriptionState.Unsubscribed;
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelDisconnected: {
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelReconnected: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.Unsubscribe: {
        return this.handleUnsubscribeInSubscribingState(inputData?.toBeUnsubscribed);
      }
      case SubscriptionFsmInputs.UnsubscribeReplySuccess: {
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.UnsubscribeReplyFailed: {
        return new GmsSubscriptionFsmReply();
      }
      default: {
        this.trace!.error(this.traceModule!, 'GmsSubscriptionShared.handleSubscribingState(): Unhandled input in state Subscribing.');
        return undefined;
      }
    }
  }

  private handleSubscribedState(input: SubscriptionFsmInputs, inputData?: GmsSubscriptionFsmInputData<T>): GmsSubscriptionFsmReply<T> | undefined {
    switch (input) {
      case SubscriptionFsmInputs.Subscribe: {
        return this.createNewGmsSubscriptionFsm(inputData?.clientId);
      }
      case SubscriptionFsmInputs.SubscribeReplySuccess: {
        // not handled
        this.trace?.error(this.traceModule!,
          `GmsSubscriptionShared.handleSubscribedState(): State: Subscribed; Input: subscribeReplySuccess;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.SubscribeReplyFailed: {
        // not handled
        this.trace?.error(this.traceModule!,
          `GmsSubscriptionShared.handleSubscribedState(): State: Subscribed; Input: subscribeReplyFailed;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelDisconnected: {
        this._state = SubscriptionState.ResubscribePending;
        this.updateGmsSubscriptionsDisconnected();
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelReconnected: {
        // not handled
        this.trace?.error(this.traceModule!,
          `GmsSubscriptionShared.handleSubscribedState(): State: Subscribed; Input: notifyChannelReconnected;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.Unsubscribe: {
        return this.handleUnsubscribeInSubscribedState(inputData!.toBeUnsubscribed!);
      }
      case SubscriptionFsmInputs.UnsubscribeReplySuccess: {
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.UnsubscribeReplyFailed: {
        return new GmsSubscriptionFsmReply();
      }
      default: {
        this.trace?.error(this.traceModule!, 'GmsSubscriptionShared.handleSubscribedState(): unhandled input in state Subscribed.');
        return undefined;
      }
    }
  }

  private handleUnsubscribingState(input: SubscriptionFsmInputs, inputData?: GmsSubscriptionFsmInputData<T>): GmsSubscriptionFsmReply<T> | undefined {
    switch (input) {
      case SubscriptionFsmInputs.Subscribe: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.SubscribeReplySuccess: {
        // not handled
        this.trace?.error(this.traceModule!,
          `GmsSubscriptionShared.handleUnsubscribingState(): State: Unsubscribing; Input: subscribeReplySuccess;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.SubscribeReplyFailed: {
        // not handled
        this.trace?.error(this.traceModule!,
          `GmsSubscriptionShared.handleUnsubscribingState(): State: Unsubscribing; Input: subscribeReplyFailed;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelDisconnected: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelReconnected: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.Unsubscribe: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.UnsubscribeReplySuccess: {
        this._state = SubscriptionState.Unsubscribed;
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.UnsubscribeReplyFailed: {
        this._state = SubscriptionState.Unsubscribed;
        this.trace?.warn(this.traceModule!, 'GmsSubscriptionShared.handleUnsubscribingState(): Unsubscribing failed for: %s',
          this.gmsId);
        return new GmsSubscriptionFsmReply();
      }
      default: {
        this.trace?.error(this.traceModule!, 'GmsSubscriptionShared.handleUnsubscribingState(): Unhandled input in state Unsubscribing.');
        return undefined;
      }
    }
  }

  private handleResubscribePendingState(input: SubscriptionFsmInputs, inputData?: GmsSubscriptionFsmInputData<T>): GmsSubscriptionFsmReply<T> | undefined {
    switch (input) {
      case SubscriptionFsmInputs.Subscribe: {
        return this.createNewGmsSubscriptionFsm(inputData?.clientId);
      }
      case SubscriptionFsmInputs.SubscribeReplySuccess: {
        // not handled
        this.trace!.error(this.traceModule!,
          `GmsSubscriptionShared.handleResubscribePendingState(): State: ResubscribePending; Input: subscribeReplySuccess;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.SubscribeReplyFailed: {
        // not handled;
        this.trace!.error(this.traceModule!,
          `GmsSubscriptionShared.handleResubscribePendingState(): State: ResubscribePending; Input: subscribeReplyFailed;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelDisconnected: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelReconnected: {
        this._state = SubscriptionState.Subscribing;
        this.subscriptionWsi = undefined;
        this.updateGmsSubscriptionsResubscribing();
        return new GmsSubscriptionFsmReply(FsmReplyType.DoSubscribe);
      }
      case SubscriptionFsmInputs.Unsubscribe: {
        // not handled
        return this.handleUnsubscribeInResubscribePendingState(inputData?.toBeUnsubscribed);
      }
      case SubscriptionFsmInputs.UnsubscribeReplySuccess: {
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.UnsubscribeReplyFailed: {
        return new GmsSubscriptionFsmReply();
      }
      default: {
        this.trace?.error(this.traceModule!, 'GmsSubscriptionShared.handleResubscribePendingState(): unhandled input in state ResubscribePending.');
        return undefined;
      }
    }
  }

  private handleUnsubscribedState(input: SubscriptionFsmInputs, inputData?: GmsSubscriptionFsmInputData<T>): GmsSubscriptionFsmReply<T> | undefined {
    // this is the end state
    switch (input) {
      case SubscriptionFsmInputs.Subscribe: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.SubscribeReplySuccess:
      case SubscriptionFsmInputs.SubscribeReplyFailed: {
        // not handled
        this.trace?.error(this.traceModule!,
          `GmsSubscriptionShared.handleUnsubscribedState(): State: Unsubscribed; Input: subscribeReplySuccess;
          Shall not reach this condition! Fix needed on the consumer side!`);
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelDisconnected: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.NotifyChannelReconnected: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.Unsubscribe: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.UnsubscribeReplySuccess: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      case SubscriptionFsmInputs.UnsubscribeReplyFailed: {
        // not handled
        return new GmsSubscriptionFsmReply();
      }
      default: {
        this.trace?.error(this.traceModule!, 'GmsSubscriptionShared.handleUnsubscribedState(): Unhandled input in state Unsubscribed.');
        return undefined;
      }
    }
  }

  private updateGmsSubscriptionsSubscribeReply(subscriptionWsi: SubscriptionGms | undefined): void {
    const success: boolean = this.isSuccess(subscriptionWsi!);
    this._gmsSubscriptionFsms.forEach(value => {
      value.subscribeReply(success);
      if (subscriptionWsi == undefined) {
        value.gmsSubscription.connectionOK = false;
      } else {
        value.gmsSubscription.connectionOK = true;
        value.gmsSubscription.errorCode = subscriptionWsi.errorCode;
        value.gmsSubscription.propertyId = subscriptionWsi.propertyId;
      }
    });
  }

  private updateGmsSubscriptionsDisconnected(): void {
    this._gmsSubscriptionFsms.forEach(value => value.notifyChannelDisconnected());
  }

  private updateGmsSubscriptionsResubscribing(): void {
    this._gmsSubscriptionFsms.forEach(value => value.notifyChannelReconnected());
  }

  private createNewGmsSubscriptionFsm(clientId: string | undefined): GmsSubscriptionFsmReply<T> {
    const valSubFsm: GmsSubscriptionFsm<T> = new GmsSubscriptionFsm<T>(this.gmsId, clientId, this._state);
    if (this.latestGmsChange != undefined) {
      valSubFsm.gmsSubscription.notifyChange(this.latestGmsChange);
    }
    if (this.subscriptionWsi != undefined) {
      valSubFsm.gmsSubscription.errorCode = this.subscriptionWsi.errorCode;
      valSubFsm.gmsSubscription.connectionOK = true;
      valSubFsm.gmsSubscription.propertyId = this.subscriptionWsi.propertyId;
    }
    this._gmsSubscriptionFsms.set(valSubFsm.id, valSubFsm);
    return new GmsSubscriptionFsmReply(FsmReplyType.None, valSubFsm);
  }

  private createFirstGmsSubscriptionFsm(clientId: string): GmsSubscriptionFsmReply<T> {
    const valSubFsm: GmsSubscriptionFsm<T> = new GmsSubscriptionFsm<T>(this.gmsId, clientId, this._state);
    this._gmsSubscriptionFsms.set(valSubFsm.id, valSubFsm);
    return new GmsSubscriptionFsmReply(FsmReplyType.DoSubscribe, valSubFsm);
  }

  private handleUnsubscribeInSubscribingState(toBeUnsubscribed: GmsSubscription<T> | undefined): GmsSubscriptionFsmReply<T> {
    const gmsSubFsm: GmsSubscriptionFsm<T> | undefined = this._gmsSubscriptionFsms.get(toBeUnsubscribed!.id);

    if (gmsSubFsm != undefined) {
      gmsSubFsm.unsubscribe();
      this._gmsSubscriptionFsms.delete(toBeUnsubscribed!.id);
      return new GmsSubscriptionFsmReply(FsmReplyType.None, undefined, gmsSubFsm);
    }
    return new GmsSubscriptionFsmReply();
  }

  private handleUnsubscribeInSubscribedState(toBeUnsubscribed: GmsSubscription<T>): GmsSubscriptionFsmReply<T> {
    if (this.refCount > 1) {
      const valSubFsm: GmsSubscriptionFsm<T> | undefined = this._gmsSubscriptionFsms.get(toBeUnsubscribed.id);
      if (valSubFsm != undefined) {
        valSubFsm.unsubscribe();
        this._gmsSubscriptionFsms.delete(toBeUnsubscribed.id);
        return new GmsSubscriptionFsmReply(FsmReplyType.None, undefined, valSubFsm);
      }
    } else {
      this._state = SubscriptionState.Unsubscribing;
      const valSubFsm: GmsSubscriptionFsm<T> | undefined = this._gmsSubscriptionFsms.get(toBeUnsubscribed.id);
      if (valSubFsm != undefined) {
        valSubFsm.unsubscribe();
        this._gmsSubscriptionFsms.delete(toBeUnsubscribed.id);
        return new GmsSubscriptionFsmReply(FsmReplyType.DoUnsubscribe, undefined, valSubFsm);
      }
    }
    return new GmsSubscriptionFsmReply();
  }

  private handleUnsubscribeInResubscribePendingState(toBeUnsubscribed: GmsSubscription<T> | undefined): GmsSubscriptionFsmReply<T> {
    const valSubFsm: GmsSubscriptionFsm<T> | undefined = this._gmsSubscriptionFsms.get(toBeUnsubscribed!.id);
    if (valSubFsm != undefined) {
      if (this.refCount <= 1) {
        this._state = SubscriptionState.Unsubscribed;
      }
      valSubFsm.unsubscribe();
      this._gmsSubscriptionFsms.delete(toBeUnsubscribed!.id);
      return new GmsSubscriptionFsmReply(FsmReplyType.None, undefined, valSubFsm);
    } else {
      this.trace?.error(this.traceModule!,
        'GmsSubscriptionShared.handleUnsubscribeInResubscribePendingState(); Gms subscription not found! Fix needed!');
      return new GmsSubscriptionFsmReply();
    }
  }

  private removeAllValueSubscriptions(): void {
    this._gmsSubscriptionFsms.clear();
  }

  private isSuccess(subscriptionsWsi: SubscriptionGms): boolean {
    return ((subscriptionsWsi != undefined) && (subscriptionsWsi.errorCode === 0)) ? true : false;
  }

  private isSuccessDel(subscriptionsDelWsi: SubscriptionDeleteWsi): boolean {
    return ((subscriptionsDelWsi != undefined) && (subscriptionsDelWsi.ErrorCode === 0)) ? true : false;
  }
}
