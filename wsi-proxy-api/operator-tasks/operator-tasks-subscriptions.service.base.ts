import { Observable } from 'rxjs';

import { OperatorTaskInfo, TaskFilterBody } from './data.model';

export abstract class OperatorTasksSubscriptionsServiceBase {
  public abstract subscribeOperatorTasks(filter: TaskFilterBody, isSuspended?: boolean): Observable<boolean>;
  public abstract operatorTasksChangeNotification(): Observable<OperatorTaskInfo[]>;
  public abstract unSubscribeOperatorTasks(): Observable<boolean>;
}
