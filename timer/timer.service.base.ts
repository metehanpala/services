import { Observable } from 'rxjs';

/**
 * Base class for the timer service.
 * Provides the functionality to subscribe for a periodic timer.
 *
 * @export
 * @abstract
 * @class TimerServiceBase
 */
export abstract class TimerServiceBase {

  /**
   * Gets the timer subscription.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf TimerServiceBase
   */
  public abstract getTimer(interval: number): Observable<number>;
}
