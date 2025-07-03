import { HttpErrorResponse, HttpParams, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ImageService } from './image.service';

class RouterStub {}
// Tests  /////////////
describe('Image Service', () => {

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
        ImageService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create Image Service',
    inject([ImageService], (imageService: ImageService) => {
      expect(imageService instanceof ImageService).toBe(true);
    }));

  it('check that getUserLanguage works ',
    inject([HttpTestingController, ImageService], (httpTestingController: HttpTestingController,
      imageService: ImageService) => {

      const body = 'imageString';

      imageService.getImage('imageId', 'libPath', 'format', 10, 10, true).
        subscribe((value: string) => {
          expect(value).toBe('imageString');
        });

      // imageService service should have made one request to GET getImage
      // workaround provided by https://github.com/angular/angular/issues/19974
      // since there is a open Issue related to httpClient with params
      const req: TestRequest =
        httpTestingController.expectOne(data => data.method === 'GET' && data.url === 'protocol://site:port/host/api/images/imageId');

      // Expect server to return the ExecuteCommand after GET
      const expectedResponse: HttpResponse<any> = new HttpResponse(
        { status: 200, statusText: 'OK', body });
      req.event(expectedResponse);

      req.flush(body);
      httpTestingController.verify();
    }));

  it('check that getImage fails ',
    inject([HttpTestingController, ImageService], (httpTestingController: HttpTestingController, imageService: ImageService) => {

      const msg = '404';
      imageService.getImage('imageId', 'libPath', 'format', 10, 10, true).subscribe(
        (data: string) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      // imageService service should have made one request to GET getImage
      // workaround provided by https://github.com/angular/angular/issues/19974
      // since there is a open Issue related to httpClient with params
      let params: HttpParams = new HttpParams({
        encoder: new WsiQueryEncoder()
      });
      params = params.append('path', 'libPath');
      params = params.append('format', 'format');
      params = params.append('width', String(10));
      params = params.append('height', String(10));
      params = params.append('encodeAsBase64', String(true));
      const reqParams: TestRequest = httpTestingController.expectOne(data => data.params.has('path'));

      // respond with a 404 and the error message in the body
      reqParams.flush(msg, { status: 404, statusText: 'Not Found' });

    }));

  // TO investigate if this Use cases are real

  // it("should call Imahe Service getImage but status fails on extractData",
  // inject([XHRBackend, ImageService, TraceService], (mockBackend: MockBackend,
  //   imageService: ImageService, traceService: TraceService) => {

  //  let body: string = "imageString";

  //   let resp: Response = new Response(new ResponseOptions({status: 404, body: body}));
  //     mockBackend.connections.subscribe((c: MockConnection) => c.mockRespond(resp));

  //   imageService.getImage("imageId", "libPath", "format", 10, 10, true)
  //     .do((data: string) => {
  //       fail("should not respond");
  //     })
  //     .catch(err => {
  //       expect(err).toMatch(err);
  //       return Observable.of(null); // failure is the expected test result
  //     }).toPromise();
  // }));

});
