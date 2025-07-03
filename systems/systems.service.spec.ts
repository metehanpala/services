import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase,
  MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { SystemInfo, SystemsResponseObject } from '../wsi-proxy-api/systems/data.model';
import { SystemsProxyServiceBase } from '../wsi-proxy-api/systems/systems-proxy.service.base';
import { SystemsProxyService } from './systems-proxy.service';
import { SystemsService } from './systems.service';

class RouterStub {}
// Tests  /////////////
describe('SystemsService', () => {

  /* eslint-disable @typescript-eslint/naming-convention */

  const systems: SystemInfo[] = [
    {
      'Name': 'name1',
      'Id': 1,
      'IsOnline': true
    },
    {
      'Name': 'name2',
      'Id': 2,
      'IsOnline': true
    },
    {
      'Name': 'name3',
      'Id': 3,
      'IsOnline': true
    }
  ];

  const sro: SystemsResponseObject = {
    'Systems': systems,
    'Languages': [
      {
        'ArrayIndex': 0,
        'Descriptor': 'English (United States)',
        'Code': 'en-US'
      },
      {
        'ArrayIndex': 1,
        'Descriptor': 'French (Canada)',
        'Code': 'fr-CA'
      }
    ],
    'IsDistributed': true,
    'IdLocal': 1
  };

  /* eslint-enable @typescript-eslint/naming-convention */

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        SystemsService,
        AuthenticationServiceBase,
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: TraceService, useClass: MockTraceService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: 'wsiSettingFilePath', useValue: 'http://MD1R0P5C.ad001.siemens.net:80' },
        { provide: Router, useClass: RouterStub },
        { provide: SystemsProxyServiceBase, useClass: SystemsProxyService },
        { provide: SignalRService, useClass: MockSignalRService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  }));

  it('Should create an instance', inject([SystemsService], (systemsService: SystemsService) => {
    expect(systemsService).toBeDefined();
  }));

  /**
   * Using actual SystemsService, mocking http response
   */
  it('getSystems() and getSystemsResponseObject() should return a SystemsResponseObject and a list of systems',
    inject([HttpTestingController, SystemsService], (httpTestingController: HttpTestingController, systemsService: SystemsService) => {

      systemsService.getSystems()
        .subscribe(
          (data: SystemInfo[]) => expect(data[0].Name).toBe(systems[0].Name),
          error => error as any);

      // languageService should have made one request to GET getUserLanguage
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/systems');

      req.flush(sro);
      httpTestingController.verify();
    }));

  /**
   * Using actual SystemsService, mocking http response
   */
  it('getSystemsExt() and getSystemsResponseObject() should return a SystemsResponseObject and a list of systems',
    inject([HttpTestingController, SystemsService], (httpTestingController: HttpTestingController, systemsService: SystemsService) => {

      systemsService.getSystemsExt()
        .subscribe(
          (data: SystemsResponseObject) => {
            expect(data.Systems[0].Name).toBe(systems[0].Name);
            expect(data.IsDistributed).toBe(true);
            expect(data.IdLocal).toBe(1);
          },
          error => error as any);

      // languageService should have made one request to GET getUserLanguage
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/systems');

      req.flush(sro);
      httpTestingController.verify();
    }));
});
