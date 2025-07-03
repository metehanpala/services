import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, Language, MockTraceService, MockWsiEndpointService,
  TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { LanguageService } from './language.service';

class RouterStub {}
// Tests  /////////////
describe('Language Service', () => {

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
        LanguageService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create Language Service',
    inject([LanguageService], (languageService: LanguageService) => {
      expect(languageService instanceof LanguageService).toBe(true);
    }));

  it('check that getUserLanguage works ',
    inject([HttpTestingController, LanguageService, TraceService], (httpTestingController: HttpTestingController,
      languageService: LanguageService, traceService: TraceService) => {

      traceService.traceSettings.debugEnabled = true;

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const body: Language = { Code: 'Code', Descriptor: 'Descriptor' };

      languageService.getUserLanguage().
        subscribe((value: Language) => {
          expect(value.Code).toBe('Code');
          expect(value.Descriptor).toBe('Descriptor');
        });

      // languageService should have made one request to GET getUserLanguage
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/languages/');

      req.flush(body);
      httpTestingController.verify();
    }));

  it('check that getUserLanguage fails ',
    inject([HttpTestingController, LanguageService], (httpTestingController: HttpTestingController, languageService: LanguageService) => {

      const msg = '404';
      languageService.getUserLanguage().subscribe(
        (data: Language) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/languages/');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  // TO DO check if it is a real Use Cases
  // it("should call Language Service getUserLanguage but status fails on wsi utility service extractData",
  // inject([XHRBackend, LanguageService, TraceService], (mockBackend: MockBackend,
  //   languageService: LanguageService, traceService: TraceService) => {

  //  let body: Language = {Code: "Code", Descriptor: "Descriptor"};

  //   let resp: Response = new Response(new ResponseOptions({status: 404, body: body}));
  //     mockBackend.connections.subscribe((c: MockConnection) => c.mockRespond(resp));

  //   languageService.getUserLanguage()
  //     .do((data: Language) => {
  //       fail("should not respond");
  //     })
  //     .catch(err => {
  //       expect(err).toMatch(err);
  //       return Observable.of(null); // failure is the expected test result
  //     }).toPromise();
  // }));

});
