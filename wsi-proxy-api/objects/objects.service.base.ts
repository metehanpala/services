import { Observable } from 'rxjs';

import { BrowserObject } from '../system-browser/data.model';
import { NewObjectParameters, ObjectCreationInfo, ServiceTextInfo, ServiceTextParameters } from './data.model';

export abstract class ObjectsServiceBase {
  /**
   * Retrieve information about the specified object regarding generic creation/deletion and child object types
   *
   * @param designation the designation of the object of interest for which related information will be returned
   *
   * @param includeChildInfo optionally include child information for the object of interest
   *
   * @returns {Observable<string>}
   *
   * @memberOf ObjectsServiceBase
   */
  public abstract getObjectCreationInfo(designation: string, includeChildInfo?: boolean): Observable<ObjectCreationInfo>;

  /**
   * Create new node under provided location node with given default values
   *
   * @param childObject the object that will be inserted
   *
   * @returns {Observable<BrowserObject>}
   *
   * @memberOf ObjectsServiceBase
   */
  public abstract createObject(childObject: NewObjectParameters): Observable<BrowserObject>;

  /**
   * Retrieve the Service Text for the specified object
   *
   * @param objectId the object that will be retrieved
   *
   * @returns {Observable<ServiceTextInfo>}
   */

  public abstract getServiceText(objectId: string): Observable<ServiceTextInfo>;

  /**
   * Update the Service Text for the specified object
   *
   * @param objectId the object that will be updated
   *
   * @param modifyServiceText the new Service Text parameters
   *
   * @returns {Observable<void>}
   */

  public abstract setServiceText(objectId: string, modifyServiceText: ServiceTextParameters): Observable<void>;
}
