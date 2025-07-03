import { GmsSubscription } from '../shared/subscription/gms-subscription';
import { ValueDetails } from '../wsi-proxy-api/shared/data.model';

export abstract class ValueSubscription2ServiceBase {

  public abstract subscribeValues(objectOrPropertyIds: string[], clientId: string,
    booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): GmsSubscription<ValueDetails>[];

  public abstract unsubscribeValues(subscriptions: GmsSubscription<ValueDetails>[], clientId: string): void;

  public abstract registerClient(clientName: string): string;

  public abstract disposeClient(clientId: string): void;
}
