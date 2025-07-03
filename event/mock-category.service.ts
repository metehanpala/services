import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { CategoryBase } from './category.service.base';
import { Category } from './data.model';

/**
 * Mock Category service.
 *
 * @export
 * @class Mock CategoryService
 * @extends {CategoryBase}
 */
@Injectable({
  providedIn: 'root'
})
export class MockCategoryService extends CategoryBase {

  private readonly categories: BehaviorSubject<Category[] | never[]> = new BehaviorSubject<Category[] | never[]>([]);

  public constructor(
    trace: TraceService) {
    super(trace);
    this.trace.info(TraceModules.events, 'Mock Category service created.');
  }

  /**
   * Gets the categories with the associated color definitions for WSI.
   *
   * @returns {Observable<Category[]>}
   *
   * @memberOf CategoryService
   */
  public getCategories(): Observable<Category[]> {
    return this.categories.asObservable();
  }
}
