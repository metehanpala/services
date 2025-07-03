/* eslint-disable */
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { ConnectionState, EventCounter, EventCounterList, EventCounterProxyServiceBase } from '../wsi-proxy-api';
import { EventCounterProxyService } from './event-counter-proxy.service';
import { EventCounterService } from './event-counter.service';
import { Observable, of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

class MockEventCounterProxyService {
  public notifyConnectionState(): Observable<boolean> {
    return of(true);
  }

  public getEventCountersAll(): Observable<EventCounterList> | any{
    return of(null);
  }

  public getEventCounters(): Observable<EventCounter> | any{
    return of(null);
  }

  public subscribeEventCounters(): Observable<boolean> {
    return of(true);
  }

  public unSubscribeEventCounters(): Observable<boolean> {
    return of(true);
  }

  public eventCountersNotification(): Observable<EventCounterList> {
    const eventCounterList: EventCounterList = {
      EventCategoryCounters:
        [
          {
            CategoryId: 1,
            CategoryDescriptor: 'Emergency',
            TotalCount: 0,
            UnprocessedCount: 0,
            TotalSubsequentGrouping: 0,
            UnprocessedSubsequentGrouping: 0,
          },
          {
            CategoryId: 2,
            CategoryDescriptor: 'Life Safety',
            TotalCount: 0,
            UnprocessedCount: 0,
            TotalSubsequentGrouping: 0,
            UnprocessedSubsequentGrouping: 0,
          }
      ],
      TotalCounters: 2,
      TotalUnprocessedCounters: 1
    }
    return of(eventCounterList);
  }
}
// Tests  /////////////
describe('EventCounterService', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: EventCounterProxyServiceBase, useClass: MockEventCounterProxyService },
        EventCounterService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
})
      .compileComponents();
  }));

  it('should create EventCounterService',
    inject([EventCounterService], (eventCounterService: EventCounterService) => {
      expect(eventCounterService instanceof EventCounterService).toBe(true);
    }
    ));

  it('should unsubscribe to event counters',
    inject([EventCounterService], (eventCounterService: EventCounterService) => {
      eventCounterService.subscribeEventCounters();
      eventCounterService.unSubscribeEventCounters().subscribe(res => {
        expect(res).toBeTrue();
      });
    }));

  it('should handle event counters',
    inject([EventCounterService, EventCounterProxyServiceBase], (eventCounterService: EventCounterService, eventCounterProxyService: MockEventCounterProxyService) => {
      const eventCounterList: EventCounterList = {
        EventCategoryCounters:
          [
            {
              CategoryId: 1,
              CategoryDescriptor: 'Emergency',
              TotalCount: 0,
              UnprocessedCount: 0,
              TotalSubsequentGrouping: 0,
              UnprocessedSubsequentGrouping: 0,
            },
            {
              CategoryId: 2,
              CategoryDescriptor: 'Life Safety',
              TotalCount: 0,
              UnprocessedCount: 0,
              TotalSubsequentGrouping: 0,
              UnprocessedSubsequentGrouping: 0,
            }
        ],
        TotalCounters: 2,
        TotalUnprocessedCounters: 1
      }
      spyOn(eventCounterProxyService, 'eventCountersNotification').and.returnValue(of(eventCounterList));
      eventCounterService.subscribeEventCounters();
      expect(eventCounterProxyService.eventCountersNotification).toHaveBeenCalled();
    }))
});
