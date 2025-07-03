import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { EventCategoryWsi } from '../wsi-proxy-api/event/data.model';
import { EventCategoriesProxyServiceBase } from '../wsi-proxy-api/event/event-categories-proxy.service.base';

/**
 * Mock Event Categories Proxy service.
 *
 * @export
 * @class Mock MockCategoriesProxyService
 * @extends {MockCategoriesProxyServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class MockEventCategoriesProxyService extends EventCategoriesProxyServiceBase {

  public eventCategoriesResponse: BehaviorSubject<EventCategoryWsi[] | null> = new BehaviorSubject<EventCategoryWsi[] | null>(null);

  public getEventCategories(): Observable<EventCategoryWsi[] | any> {
    return this.eventCategoriesResponse.asObservable();
  }
}
