import { Observable, ReplaySubject } from 'rxjs';

import { WSIProcedure } from '../public-api';
import { Procedure, Step } from './data.model';

/**
 * Base class for an assisted treatment service.
 * See the WSI documentation for details.
 */
export abstract class AssistedTreatmentServiceBase {
  public subscribedOperatingProcedure: ReplaySubject<Procedure> = new ReplaySubject();
  /**
   * Subscribes to a specific procedure.
   *
   * @abstract
   * @returns { void }
   *
   * @memberOf AssistedTreatmentServiceBase
   */
  public abstract subscribeProcedure(procedureId: string): void;

  /**
   * Unsubscribes to the procedure.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf AssistedTreatmentServiceBase
   */
  public abstract unSubscribeProcedure(): Observable<boolean>;

  /**
   * @abstract
   * @returns { Observable<Procedure> }
   *
   * @memberOf AssistedTreatmentServiceBase
   */
  public abstract procedureNotification(): Observable<Procedure>;

  /**
   * Send Step command.
   *
   * @abstract
   * @returns { void }
   *
   * @memberOf AssistedTreatmentServiceBase
   */
  public abstract updateStep(procedureId: string, step: Step): void;

  /**
   * get treatment data.
   *
   * @memberOf AssistedTreatmentServiceBase
   */
  public abstract getProcedure(procedureId: string, step: Step): Observable<WSIProcedure>;
}
