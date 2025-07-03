import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { DiagnosticsService } from './diagnostics.service';

class RouterStub {}
// Tests  /////////////
describe('Diagnostics Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        DiagnosticsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create Diagnostics Service',
    inject([DiagnosticsService], (diagnosticsService: DiagnosticsService) => {
      expect(diagnosticsService instanceof DiagnosticsService).toBe(true);
    }));

  it('should call ping method',
    inject([HttpTestingController, DiagnosticsService], (httpTestingController: HttpTestingController, diagnosticsService: DiagnosticsService) => {

      diagnosticsService.ping().subscribe((value: boolean) => {
        expect(value).toBe(true);

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/diagnostics/');

        httpTestingController.verify();
      });
    }));

});
