import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ApplicationRight, AppRights } from '../wsi-proxy-api/app-rights/data.model';
import { AppRightsServiceProxy } from './app-rights.service-proxy';

/* eslint-disable @typescript-eslint/naming-convention */

const applicationRights: ApplicationRight[] = [
  {
    Id: 12,
    Name: 'Document Viewer',
    Operations: [
      {
        Id: 384,
        Name: 'Show'
      }
    ]
  },
  {
    Id: 46,
    Name: 'Schedules',
    Operations: [
      {
        Id: 1472,
        Name: 'Show'
      },
      {
        Id: 1474,
        Name: 'Configure'
      }
    ]
  }
];

/* eslint-enable @typescript-eslint/naming-convention */

class RouterStub {}
// Tests  /////////////
describe('AppRightsServiceProxy', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        AppRightsServiceProxy,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create AppRightsServiceProxy',
    inject([AppRightsServiceProxy], (appRightsServiceProxy: AppRightsServiceProxy) => {
      expect(appRightsServiceProxy instanceof AppRightsServiceProxy).toBe(true);
    }
    ));

  //  it("should check that getAppRights() method works ",
  //   inject([HttpTestingController, AppRightsServiceProxy], (httpTestingController: HttpTestingController, appRightsServiceProxy: AppRightsService) => {

  //     const body: AppRights = applicationRight[0];

  //     appRightsServiceProxy.getAppRights("application").
  //       subscribe((data: AppRights) => {
  //         expect(data).toEqual(body);
  //     });

  //     const req: TestRequest =
  //     httpTestingController.expectOne( data => data.method === "GET" && data.url === "protocol://site:port/host/api/accessrights/application");

  //     const expectedResponse: HttpResponse<any> = new HttpResponse(
  //       { status: 200, statusText: "OK", body: body });
  //     req.event(expectedResponse);

  //     req.flush(body);
  //     httpTestingController.verify();

  //   })
  // );

  it('should check that getAppRightsAll() method works',
    inject([HttpTestingController, AppRightsServiceProxy], (httpTestingController: HttpTestingController, appRightsServiceProxy: AppRightsServiceProxy) => {

      appRightsServiceProxy.getAppRightsAll()
        .subscribe(
          (rights: AppRights) => expect(rights.ApplicationRights).toBe(applicationRights),
          error => error as any);

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/accessrights/');

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const appRights: AppRights = { ApplicationRights: applicationRights };
      req.flush(appRights);
      httpTestingController.verify();
    }
    ));

});
