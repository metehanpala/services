import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { FilesService } from './files.service';

class RouterStub {}

// Tests  /////////////
describe('Files Service', () => {

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
        { provide: FilesServiceBase, useClass: FilesService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create Files Service',
    inject([FilesServiceBase], (filesService: FilesServiceBase) => {
      expect(filesService instanceof FilesService).toBe(true);
    }));

  it('should get file',
    inject([HttpTestingController, FilesServiceBase], (httpTestingController: HttpTestingController, filesService: FilesServiceBase) => {

      const body: Blob = new Blob(['a', 'b', 'c']);

      filesService.getFile(1, 'path').
        subscribe((data: Blob) => {
          expect(data).toBeDefined();
        });

      // eventCounterService should have made one request to GET getEventCountersAll
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/files/1/path');

      req.flush(body);
      httpTestingController.verify();
    }));

});
