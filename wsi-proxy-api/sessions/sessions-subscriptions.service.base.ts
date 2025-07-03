import { Observable } from 'rxjs';

import { SessionRepresentation, SessionsData } from './data.model';

export abstract class SessionsSubscriptionsServiceBase {
  public abstract subscribeSessions(systemId: number): Observable<any>;
  public abstract sessionsChangeNotification(): Observable<SessionsData>;
  public abstract unsubscribeSessions(systemId: number, subscriptionKey: number,): Observable<any>;
}