import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase,
  MockTraceService, ProductService, TraceService, WsiSettings } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from './wsi-endpoint.service';

class RouterStub {}

// Tests  /////////////
describe('WSI Endpoint Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: 'productSettingFilePath', useValue: 'noMatter' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        WsiEndpointService,
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        ProductService,
        AuthenticationServiceBase,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create WsiEndpointService',
    inject([WsiEndpointService], (wsiEndpointService: WsiEndpointService) => {
      expect(wsiEndpointService instanceof WsiEndpointService).toBe(true);
    }));

  it('should get a response', (done: DoneFn) => {
    inject([HttpTestingController, WsiEndpointService], (httpTestingController: HttpTestingController, wsiEndpointService: WsiEndpointService) => {

      expect(wsiEndpointService.entryPoint).toBe(undefined);
      const body: any = {
        protocol: 'https',
        host: '141.29.246.241',
        port: '444',
        site: 'WSI',
        renewTimeOut: '120'
      };

      wsiEndpointService.readEntryPointFile().subscribe(response => {
        expect(response).toEqual(body);
        wsiEndpointService.settingsRead.
          subscribe((values: WsiSettings) => {
            expect(values).toBe(values);
          });
        done();
      });

      // wsiEndpointService should have made one request to GET readEntryPointFile
      const req: TestRequest = httpTestingController.expectOne('https://fake-server.com');

      req.flush(body);
      httpTestingController.verify();
    })();
  });

  // it("check that settingsRead work ",
  //  inject([HttpTestingController, WsiEndpointService], (httpTestingController: HttpTestingController, wsiEndpointService: WsiEndpointService) => {

  //     expect(wsiEndpointService.renewTimeOut).toBe(undefined);

  //     let body: any = {
  //     protocol: "https",
  //     host: "141.29.246.241",
  //     port: "444",
  //     site: "WSI",
  //     renewTimeOut: 120
  //   };

  //    wsiEndpointService.readEntryPointFile().
  //     subscribe((values: WsiSettings) => {
  //       expect(values).toEqual(body);
  //     });

  //   expect(wsiEndpointService.renewTimeOut).toBe(120);

  // }));

});
