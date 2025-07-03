import { Observable } from 'rxjs';

import { ConnectionState, SubscriptionDeleteWsi } from '../shared/data.model';
import { SystemBrowserSubscription, SystemBrowserSubscriptionKey } from './data.model';

/**
 * Base class for the system-browser subscription proxy service.
 */
export abstract class SystemBrowserSubscriptionProxyServiceBase {

  public abstract subscribeNodeChanges(designation: string): Observable<SystemBrowserSubscriptionKey>;

  public abstract unsubscribeNodeChanges(key: number): Observable<SubscriptionDeleteWsi>;

  public abstract nodeChangeNotification(): Observable<SystemBrowserSubscription[]>;

  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
