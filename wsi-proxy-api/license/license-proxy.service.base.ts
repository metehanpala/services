import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { LicenseWsi } from './data.model';

/**
 * Base class for the license service.
 * Provides the functionality to read license from WSI.
 *
 * @export
 * @abstract
 * @class LicenseBase
 */
export abstract class LicenseProxyServiceBase {

  public abstract notifyConnectionState(): Observable<ConnectionState>;

  public abstract licenseNotification(): Observable<LicenseWsi>;

  public abstract subscribeLicense(): Observable<boolean>;

  public abstract unsubscribeLicense(): Observable<boolean>;
}
