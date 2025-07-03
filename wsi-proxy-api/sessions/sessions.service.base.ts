import { Observable } from 'rxjs';

export abstract class SessionsServiceBase {
  public abstract deleteSession(systemId: number, sessionId: string): Observable<any>;
}