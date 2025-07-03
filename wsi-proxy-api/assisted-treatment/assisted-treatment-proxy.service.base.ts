import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { WSIProcedure, WSIStep } from './data.model';

/**
 * Base class for the assisted treatment service.
 * See the WSI documentation for details.
 */
export abstract class AssistedTreatmentProxyServiceBase {
  public abstract isSubscribed: boolean;

  /**
   * Subscribes to a specific procedure.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf AssistedTreatmentProxyServiceBase
   */
  public abstract subscribeProcedure(procedureId: string): Observable<boolean>;

  /**
   * Unsubscribes to the procedure.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf AssistedTreatmentProxyServiceBase
   */
  public abstract unSubscribeProcedure(procedureId?: string): Observable<boolean>;

  /**
   * Get the procedure.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf AssistedTreatmentProxyServiceBase
   */

  public abstract getProcedure(procedureID: string): Observable<WSIProcedure>;

  /**
   * @abstract
   * @returns { Observable<WsiProcedure> }
   *
   * @memberOf AssistedTreatmentProxyServiceBase
   */
  public abstract procedureNotification(): Observable<WSIProcedure>;

  /**
   * Notify about the connection state
   *
   * @abstract
   * @returns { Observable<ConnectionState> }
   *
   * @memberOf AssistedTreatmentProxyServiceBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;

  /**
   * Send Step command.
   *
   * @abstract
   * @returns { Observable<void> }
   *
   * @memberOf AssistedTreatmentProxyServiceBase
   */

  public abstract updateStep(procedureID: string, step: WSIStep): Observable<void>;

}
