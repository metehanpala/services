import { Observable } from 'rxjs';

import { RelatedObjects } from './data.model';

export abstract class RelatedItemsServiceBase {
  /**
   * Gets a list of objects which are "related" to the provided object
   * @param objectId the object of interest for which related objects will be returned
   *
   * @returns {Observable<string>}
   *
   * @memberOf RelatedItemsServiceBase
   */
  public abstract getRelatedItems(objectIds: string[]): Observable<RelatedObjects>;
}
