import { GmsSubscription } from '../shared/subscription/gms-subscription';
import { SystemBrowserSubscription } from '../wsi-proxy-api/system-browser/data.model';

export abstract class SystemBrowserSubscriptionServiceBase {

  public abstract subscribeNodeChanges(designation: string, clientId: string): GmsSubscription<SystemBrowserSubscription> | undefined;

  public abstract unsubscribeNodeChanges(subscription: GmsSubscription<SystemBrowserSubscription>, clientId: string): void;

  public abstract registerClient(clientName: string): string | undefined;

  public abstract disposeClient(clientId: string): void;
}
