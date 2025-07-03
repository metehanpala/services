import { Injectable } from '@angular/core';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, zip as observableZip } from 'rxjs';
import { map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { EventCategoryWsi } from '../wsi-proxy-api/event/data.model';
import { EventCategoriesProxyServiceBase } from '../wsi-proxy-api/event/event-categories-proxy.service.base';
import { EventColors, SubTables, Tables } from '../wsi-proxy-api/tables/data.model';
import { TablesServiceBase } from '../wsi-proxy-api/tables/tables.service.base';
import { CategoryBase } from './category.service.base';
import { Category } from './data.model';

/**
 * Category service.
 * Provides the functionality to read categories and associated colors from WSI.
 *
 * @export
 * @class CategoryService
 * @extends {CategoryBase}
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService extends CategoryBase {

  public constructor(
    trace: TraceService,
    private readonly tablesService: TablesServiceBase,
    private readonly eventCategoriesServiceProxy: EventCategoriesProxyServiceBase) {
    super(trace);
    this.trace.info(TraceModules.events, 'Category service created.');
  }

  /**
   * Gets the categories with the associated color definitions for WSI.
   *
   * @returns {Observable<Category[]>}
   *
   * @memberOf CategoryService
   */
  public getCategories(): Observable<Category[]> {
    this.trace.info(TraceModules.events, 'getCategories() called.');

    const evtcat$: Observable<EventCategoryWsi[]> = this.eventCategoriesServiceProxy.getEventCategories();
    const colorTable$: Observable<Map<number, Map<EventColors, string>>> = this.tablesService.getSubTable(Tables.Categories, SubTables.Colors);
    return observableZip(evtcat$, colorTable$).pipe(
      map((results: [EventCategoryWsi[], Map<number, Map<EventColors, string>> ]) => this.onCreateCategory(results[0], results[1])));

  }

  private onCreateCategory(eventCategories: EventCategoryWsi[], colorTables: Map<number, Map<EventColors, string>>): Category[] {
    this.trace.info(TraceModules.events, 'getCategories(): all required calls returned. Creating category model now...');

    const createdCat: Category[] = [];
    if (!isNullOrUndefined(eventCategories) && eventCategories.length > 0) {
      eventCategories.forEach(eventCategory => {
        const colorTable: Map<EventColors, string> | undefined = colorTables.get(eventCategory.CategoryId);
        const buttonBright: string | undefined = colorTable?.get(EventColors.ButtonGradientBright);
        const buttonDark: string | undefined = colorTable?.get(EventColors.ButtonGradientDark);
        if (buttonBright && buttonDark && this.hexToYiq(buttonBright) < this.hexToYiq(buttonDark)) {
          // invert the colors
          colorTable?.set(EventColors.ButtonGradientBright, buttonDark);
          colorTable?.set(EventColors.ButtonGradientDark, buttonBright);
        }
        createdCat.push(new Category(eventCategory.CategoryId, eventCategory.CategoryName, colorTable));
      });
      
    }
    if (this.trace.isDebugEnabled(TraceModules.events)) {
      let catStr = '';
      createdCat.forEach(cat => {
        catStr = catStr + '\n\n' + cat.toString();
      });
      this.trace.debug(TraceModules.events, 'Categories: %s', catStr);
    }
    return createdCat;
  }

  private hexToYiq(hexcolor: string): number {
    if (hexcolor == undefined) {
      return 0;
    }
    const split: string[] = hexcolor.split(',');
    if (split.length < 3) {
      return 0;
    }
    const r: number = parseInt(split[0], 10);
    const g: number = parseInt(split[1], 10);
    const b: number = parseInt(split[2], 10);
    const yiq: number = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq;
  }
}
