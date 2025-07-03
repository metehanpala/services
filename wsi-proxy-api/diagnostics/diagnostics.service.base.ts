import { Observable } from 'rxjs';

/**
 * Base class for the diagnostics service.
 */
export abstract class DiagnosticsServiceBase {

  /**
   * Pings the WSI diagnostics service
   *
   * @abstract
   * @returns {Observable<void>}
   *
   * @memberOf DiagnosticsBase
   */
  public abstract ping(): Observable<any>;
}
