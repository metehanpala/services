import { GmsSubscription, SubscriptionState } from './gms-subscription';

const enum FsmInputs {
  SubscribeReplySuccess = 0,
  SubscribeReplyFailed = 1,
  NotifyChannelDisconnected = 2,
  NotifyChannelReconnected = 3,
  Unsubscribe = 4
}

export class GmsSubscriptionFsm<T> {

  public gmsSubscription: GmsSubscription<T>;

  constructor(
    public gmsId: string | undefined,
    clientName: string | undefined,
    state: SubscriptionState = SubscriptionState.Subscribing) {
    this.gmsSubscription = new GmsSubscription<T>(gmsId!, clientName!, state);
  }

  public get id(): number {
    return this.gmsSubscription.id;
  }

  public subscribeReply(success: boolean): void {
    if (success) {
      this.handleStateChange(FsmInputs.SubscribeReplySuccess);
    } else {
      this.handleStateChange(FsmInputs.SubscribeReplyFailed);
    }
  }

  public unsubscribe(): void {
    this.handleStateChange(FsmInputs.Unsubscribe);
  }

  public notifyChannelDisconnected(): void {
    this.handleStateChange(FsmInputs.NotifyChannelDisconnected);
  }

  public notifyChannelReconnected(): void {
    this.handleStateChange(FsmInputs.NotifyChannelReconnected);
  }

  private handleStateChange(input: FsmInputs): void {
    switch (this.gmsSubscription.state) {
      case SubscriptionState.Subscribing: {
        this.handleSubscribingState(input);
        break;
      }
      case SubscriptionState.Subscribed: {
        this.handleSubscribedState(input);
        break;
      }
      case SubscriptionState.Unsubscribing: {
        this.handleUnsubscribingState(input);
        break;
      }
      case SubscriptionState.Unsubscribed: {
        this.handleUnsubscribedState(input);
        break;
      }
      case SubscriptionState.ResubscribePending: {
        this.handleResubscribingState(input);
        break;
      }
      default: {
        throw new Error('GmsSubscriptionFsm.handleStateChange(): Unknown state!');
      }
    }
  }

  private handleSubscribingState(input: FsmInputs): void {
    if (input === FsmInputs.SubscribeReplySuccess) {
      this.gmsSubscription.state = SubscriptionState.Subscribed;
      return;
    } else if ((input === FsmInputs.SubscribeReplyFailed) || (input === FsmInputs.Unsubscribe)) {
      this.gmsSubscription.state = SubscriptionState.Unsubscribed;
      return;
    }
  }

  private handleSubscribedState(input: FsmInputs): void {
    if (input === FsmInputs.NotifyChannelDisconnected) {
      this.gmsSubscription.state = SubscriptionState.ResubscribePending;
      return;
    } else if (input === FsmInputs.Unsubscribe) {
      this.gmsSubscription.state = SubscriptionState.Unsubscribed;
      return;
    }
  }

  private handleUnsubscribingState(input: FsmInputs): void {
    // state not handled
  }

  private handleUnsubscribedState(input: FsmInputs): void {
    // end state
  }

  private handleResubscribingState(input: FsmInputs): void {
    if (input === FsmInputs.NotifyChannelReconnected) {
      this.gmsSubscription.state = SubscriptionState.Subscribing;
      this.gmsSubscription.errorCode = undefined;
      this.gmsSubscription.connectionOK = undefined;
      return;
    } else if (input === FsmInputs.Unsubscribe) {
      this.gmsSubscription.state = SubscriptionState.Unsubscribed;
      return;
    }
  }
}
