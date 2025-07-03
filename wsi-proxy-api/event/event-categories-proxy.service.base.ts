import { Observable } from 'rxjs';

import { ConnectionState } from '../shared/data.model';
import { EventCategoryWsi } from './data.model';

/**
 * Base class for the event category service.
 * Provides the functionality to read and subscribe to categories for current user
 *
 * @export
 * @abstract
 * @class EventCategoriesProxyServiceBase
 */
export abstract class EventCategoriesProxyServiceBase {

  /**
   * Gets the categories for the current user.
   *
   * @abstract
   * @returns {Observable<EventCategoryWsi[]>}
   *
   * @memberOf EventCategoriesProxyServiceBase
   */
  public abstract getEventCategories(): Observable<EventCategoryWsi[]>;
}
