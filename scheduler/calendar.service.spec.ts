import { HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { CalendarService } from './calendar.service';

class RouterStub {}
// Tests  /////////////
describe('Calendar Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'productSettingFilePath', useValue: 'noMatter' },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        CalendarService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create CalendarService',
    inject([CalendarService], (calendarService: CalendarService) => {
      expect(calendarService instanceof CalendarService).toBe(true);
      expect(calendarService).toBeTruthy();
    }
    ));

  it('should call getCalendar',
    inject([HttpTestingController, CalendarService], (httpTestingController: HttpTestingController, calendarService: CalendarService) => {
      calendarService.getCalendar('ObjectId')
        .subscribe(
          (data: string) => expect(data).toBe('body'),
          err => err as any);

      // calendarService should have made one request to GET getCalendar
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/scheduler/calendar/ObjectId');
      req.flush('body');
      httpTestingController.verify();
    }
    ));

  it('check if saveCalendar is called',
    inject([HttpTestingController, CalendarService], (httpTestingController: HttpTestingController,
      calendarService: CalendarService) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const calendar: any = { ObjectId: '1' };
      calendarService.saveCalendar(calendar).subscribe(
        (data: any) => expect(data.ObjectId).toEqual(undefined)
      );
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/scheduler/calendar/save');
      expect(req.request.method).toBe('POST');

      req.flush(new HttpResponse<any>());
    })
  );
});
