import { Observable } from 'rxjs';

/**
 * Base class for the license service.
 * Provides the functionality to read license from WSI.
 *
 * @export
 * @abstract
 * @class LicenseBase
 */
export abstract class LicenseServiceBase {

  public abstract unSubscribeLicense(): Observable<boolean>;

  public abstract subscribeLicense(): void;
}
