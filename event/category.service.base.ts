import { TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { Category } from './data.model';

/**
 * Base class for the category service.
 * Provides the functionality to read categories and associated colors from WSI.
 *
 * @export
 * @abstract
 * @class CategoryBase
 */
export abstract class CategoryBase {

  public constructor(public trace: TraceService) {
  }

  /**
   * Gets the categories with the associated color definitions for WSI.
   *
   * @abstract
   * @returns {Observable<Category[]>}
   *
   * @memberOf CategoryBase
   */
  public abstract getCategories(): Observable<Category[]>;
}
