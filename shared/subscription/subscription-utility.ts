import { ConnectionState } from '../../wsi-proxy-api/shared/data.model';
import { SubscriptionState } from './gms-subscription';

export class SubscriptionUtility {

  public static convert(value: SignalR.ConnectionState): ConnectionState {
    if (value === SignalR.ConnectionState.Connecting) {
      return ConnectionState.Connecting;
    } else if (value === SignalR.ConnectionState.Connected) {
      return ConnectionState.Connected;
    } else if (value === SignalR.ConnectionState.Reconnecting) {
      return ConnectionState.Reconnecting;
    } else if (value === SignalR.ConnectionState.Disconnected) {
      return ConnectionState.Disconnected;
    } else {
      throw new Error('Unhandled connection state!');
    }
  }

  public static getTextForConnection(state: ConnectionState): string {
    if (state === ConnectionState.Connected) {
      return 'Connected';
    } else if (state === ConnectionState.Connecting) {
      return 'Connecting';
    } else if (state === ConnectionState.Disconnected) {
      return 'Disconnected';
    } else if (state === ConnectionState.Reconnecting) {
      return 'Reconnecting';
    }
    return '';
  }

  public static getText(state: SubscriptionState): string {
    if (state === SubscriptionState.Subscribed) {
      return 'Subscribed';
    } else if (state === SubscriptionState.Subscribing) {
      return 'Subscribing';
    } else if (state === SubscriptionState.ResubscribePending) {
      return 'ResubscribePending';
    } else if (state === SubscriptionState.Unsubscribing) {
      return 'Unsubscribing';
    } else if (state === SubscriptionState.Unsubscribed) {
      return 'Unsubscribed';
    } else {
      return '';
    }
  }
}
