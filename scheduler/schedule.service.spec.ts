import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ScheduleService } from './schedule.service';

class RouterStub {}
// Tests  /////////////
describe('Schedule Service', () => {

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
        ScheduleService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create ScheduleService',
    inject([ScheduleService], (scheduleService: ScheduleService) => {
      expect(scheduleService instanceof ScheduleService).toBe(true);
    }
    ));

  it('should call getSchedules',
    inject([HttpTestingController, ScheduleService], (httpTestingController: HttpTestingController, scheduleService: ScheduleService) => {

      scheduleService.getSchedules('ObjectId')
        .subscribe(
          (data: string) => expect(data).toBe('body'),
          error => error as any);

      // scheduleService should have made one request to GET getSchedules
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/scheduler/schedule/ObjectId');

      req.flush('body');
      httpTestingController.verify();
    }
    ));

  it('check saveSchedule with valid parameters',
    inject([HttpTestingController, ScheduleService], (httpTestingController: HttpTestingController, scheduleService: ScheduleService) => {
      const mockSchedule: any = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ObjectId: '1'
      };
      scheduleService.saveSchedule('1').subscribe(
        (data: any) => {
          expect(data.ObjectId).toEqual('1', data);
        }
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/scheduler/schedule/save');
      expect(req.request.method).toEqual('POST');
    })
  );

  it('check saveScheduleOptions with valid parameters',
    inject([HttpTestingController, ScheduleService],
      (httpTestingController: HttpTestingController, scheduleService: ScheduleService) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const schedule: any = { ObjectId: '1' };

        scheduleService.saveScheduleOptions(schedule).subscribe(
          (data: any) => expect(data).toBe('body'),
          error => error as any);

        const req: any = httpTestingController.expectOne('protocol://site:port/host/api/scheduler/schedule/saveOptions');

        req.flush('body');
        httpTestingController.verify();

      })
  );

  it('check that getCalendarExceptions is called',
    inject([HttpTestingController, ScheduleService], (httpTestingController: HttpTestingController, scheduleService: ScheduleService) => {
      const calendarObjectIds: string[] = ['ObjectId'];

      scheduleService.getCalendarExceptions(calendarObjectIds).subscribe(
        (data: any) => expect(data).toBe('body'),
        error => error as any);

      const testUrl = 'protocol://site:port/host/api/scheduler/calendarExceptions/';
      const req: TestRequest = httpTestingController.expectOne(testUrl, 'Failed for request url: ' + testUrl);

      req.flush('body');
      httpTestingController.verify();
    })
  );
});
