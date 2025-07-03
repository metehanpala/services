import { Observable } from 'rxjs';

import { LicencseOptions } from './data.model';

/**
 * Base class for the license service.
 * Provides the functionality to read license from WSI.
 *
 * @export
 * @abstract
 * @class LicenseBase
 */
export abstract class LicenseOptionsProxyServiceBase {

  public abstract getLicenseOptionsRightsAll(): Observable<LicencseOptions[]>;

}
