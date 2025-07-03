import { GmsSubscription } from '../shared/subscription/gms-subscription';
import { PropertyCommand } from '../wsi-proxy-api/command/data.model';

export abstract class CommandSubscriptionServiceBase {

  public abstract subscribeCommands(propertyIds: string[], clientId: string, booleansAsNumericText?: boolean): GmsSubscription<PropertyCommand>[];

  public abstract unsubscribeCommands(subscriptions: GmsSubscription<PropertyCommand>[], clientId: string): void;

  public abstract registerClient(clientName: string): string;

  public abstract disposeClient(clientId: string): void;
}
