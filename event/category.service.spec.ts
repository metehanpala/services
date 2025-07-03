import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject } from 'rxjs';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { EventCategoryWsi } from '../wsi-proxy-api/event/data.model';
import { EventCategoriesProxyServiceBase } from '../wsi-proxy-api/event/event-categories-proxy.service.base';
import { EventColors } from '../wsi-proxy-api/tables/data.model';
import { TablesServiceBase } from '../wsi-proxy-api/tables/tables.service.base';
import { CategoryService } from './category.service';
import { Category } from './data.model';
import { MockEventCategoriesProxyService } from './mock-event-categories-proxy.service';
import { MockTablesService } from './mock-tables.service';

class RouterStub {}
// Tests  /////////////
describe('Category Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        AuthenticationServiceBase,
        { provide: TablesServiceBase, useClass: MockTablesService },
        { provide: EventCategoriesProxyServiceBase, useClass: MockEventCategoriesProxyService },
        CategoryService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create Category Service',
    inject([CategoryService], (categoryService: CategoryService) => {
      expect(categoryService instanceof CategoryService).toBe(true);
    }));

  it('should call getCategories()',
    inject([CategoryService, TablesServiceBase, EventCategoriesProxyServiceBase],
      (categoryService: CategoryService, tableService: MockTablesService, eventCategoriesProxyService: MockEventCategoriesProxyService) => {
        const eventCategoriesProxyResponse: EventCategoryWsi[] = [];
        const subtableResponse: Map<number, Map<EventColors, string>> = new Map<number, Map<EventColors, string>>();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eventCategoriesProxyResponse.push({ 'CategoryId': 1, 'CategoryName': 'Category 1' });
        eventCategoriesProxyService.eventCategoriesResponse = new BehaviorSubject<EventCategoryWsi[] | null>(eventCategoriesProxyResponse);
        subtableResponse.set(1, new Map<EventColors, string>([[EventColors.ButtonGradientBright, 'FFFFFF']]));
        tableService.subtableResponse = new BehaviorSubject<Map<number, Map<EventColors, string>> | null>(subtableResponse);
        categoryService.getCategories().
          subscribe((data: Category[]) => {
            expect(data).toBe(data);
          });
      }));

  it('should call getCategories()',
    inject([CategoryService, TablesServiceBase, EventCategoriesProxyServiceBase],
      (categoryService: CategoryService, tableService: MockTablesService, eventCategoriesProxyService: MockEventCategoriesProxyService) => {
        const eventCategoriesProxyResponse: EventCategoryWsi[] = [];
        const subtableResponse: Map<number, Map<EventColors, string>> = new Map<number, Map<EventColors, string>>();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eventCategoriesProxyResponse.push({ 'CategoryId': 1, 'CategoryName': 'Category 1' });
        eventCategoriesProxyService.eventCategoriesResponse = new BehaviorSubject<EventCategoryWsi[] | null>(eventCategoriesProxyResponse);
        subtableResponse.set(1, new Map<EventColors, string>([
          [EventColors.ButtonGradientBright, 'FFFFFF']]));
        tableService.subtableResponse = new BehaviorSubject<Map<number, Map<EventColors, string>> | null>(subtableResponse);

        categoryService.getCategories().
          subscribe((data: Category[]) => {
            expect(data).toBe(data);
          });
      }));

  it('should call getCategories() and invert colors',
    inject([CategoryService, TablesServiceBase, EventCategoriesProxyServiceBase],
      (categoryService: CategoryService, tableService: MockTablesService, eventCategoriesProxyService: MockEventCategoriesProxyService) => {
        const eventCategoriesProxyResponse: EventCategoryWsi[] = [];
        const subtableResponse: Map<number, Map<EventColors, string>> = new Map<number, Map<EventColors, string>>();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eventCategoriesProxyResponse.push({ 'CategoryId': 1, 'CategoryName': 'Category 1' });
        eventCategoriesProxyService.eventCategoriesResponse = new BehaviorSubject<EventCategoryWsi[] | null>(eventCategoriesProxyResponse);
        subtableResponse.set(1, new Map<EventColors, string>([
          [EventColors.ButtonGradientBright, '100,100,100'],
          [EventColors.ButtonGradientDark, '200,200,200']
        ]));
        tableService.subtableResponse = new BehaviorSubject<Map<number, Map<EventColors, string>> | null>(subtableResponse);

        categoryService.getCategories().
          subscribe((data: Category[]) => {
            expect(data).toBe(data);
            expect(data[0].colors?.get(EventColors.ButtonGradientBright)).toBe('200,200,200');
            expect(data[0].colors?.get(EventColors.ButtonGradientDark)).toBe('100,100,100');
          });
      }));

  it('should call getCategories() with debug enabled',
    inject([CategoryService, TraceService,
      TablesServiceBase, EventCategoriesProxyServiceBase],
    (categoryService: CategoryService, traceService: MockTraceService,
      tableService: MockTablesService, eventCategoriesProxyService: MockEventCategoriesProxyService) => {

      traceService.traceSettings.debugEnabled = true;

      const tableResponse: Map<number, string> = new Map<number, string>();
      const eventCategoriesProxyResponse: EventCategoryWsi[] = [];
      const subtableResponse: Map<number, Map<EventColors, string>> = new Map<number, Map<EventColors, string>>();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eventCategoriesProxyResponse.push({ 'CategoryId': 1, 'CategoryName': 'Category 1' });
      eventCategoriesProxyService.eventCategoriesResponse = new BehaviorSubject<EventCategoryWsi[] | null>(eventCategoriesProxyResponse);
      subtableResponse.set(1, new Map<EventColors, string>([
        [EventColors.ButtonGradientBright, '100,100,100'],
        [EventColors.ButtonGradientDark, '200,200,200']
      ]));
      tableService.subtableResponse = new BehaviorSubject<Map<number, Map<EventColors, string>> | null>(subtableResponse);

      categoryService.getCategories().
        subscribe((data: Category[]) => {
          expect(data).toBe(data);
        });
    }));

});
