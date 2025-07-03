import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { Value, ValueDetails } from '../wsi-proxy-api/shared/data.model';
import { ValueService } from './value.service';

class RouterStub {}
// Tests  /////////////
describe('ValueService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'http://CH1W80106.ad001.siemens.net:80' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        ValueService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create ValueService',
    inject([ValueService], (valueService: ValueService) => {
      expect(valueService instanceof ValueService).toBe(true);
    }));

  it('check that readValue works ',
    inject([HttpTestingController, ValueService], (httpTestingController: HttpTestingController,
      valueService: ValueService) => {

      /* eslint-disable @typescript-eslint/naming-convention */

      const value: Value = {
        Value: 'Value',
        DisplayValue: 'DisplayValue',
        Timestamp: 'Timestamp',
        QualityGood: true,
        Quality: 'Quality'
      };

      const valueDetails: ValueDetails[] = [
        {
          DataType: 'DataType',
          ErrorCode: 1,
          SubscriptionKey: 0,
          Value: value,
          IsArray: true
        },
        {
          DataType: 'DataType',
          ErrorCode: 1,
          SubscriptionKey: 1,
          Value: value,
          IsArray: true
        }
      ];

      /* eslint-enable @typescript-eslint/naming-convention */

      valueService.readValue('OriginalObjectOrPropertyId').
        subscribe((values: ValueDetails[]) => {
          expect(values).toBe(valueDetails);
        });

      // valueService should have made one request to GET readValue
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/values/OriginalObjectOrPropertyId');

      req.flush(valueDetails);
      httpTestingController.verify();
    }));

  it('check that readValues works ',
    inject([HttpTestingController, ValueService, TraceService], (httpTestingController: HttpTestingController,
      valueService: ValueService, traceService: TraceService) => {

      /* eslint-disable @typescript-eslint/naming-convention */

      const value: Value = {
        Value: 'Value',
        DisplayValue: 'DisplayValue',
        Timestamp: 'Timestamp',
        QualityGood: true,
        Quality: 'Quality'
      };

      const valueDetails: ValueDetails[] = [
        {
          DataType: 'DataType',
          ErrorCode: 1,
          SubscriptionKey: 0,
          Value: value,
          IsArray: true
        },
        {
          DataType: 'DataType',
          ErrorCode: 1,
          SubscriptionKey: 1,
          Value: value,
          IsArray: true
        }
      ];

      /* eslint-enable @typescript-eslint/naming-convention */

      traceService.traceSettings.debugEnabled = true;

      valueService.readValues(['OriginalObjectOrPropertyId', 'OriginalObjectOrPropertyId2']).
        subscribe((values: ValueDetails[]) => {
          expect(values).toBe(valueDetails);
        });

      // valueService should have made one request to GET readValues
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/values/');

      req.flush(valueDetails);
      httpTestingController.verify();

    }));

  it('should call readValue but status fails on PropertyId undefined',
    inject([HttpTestingController, ValueService], (httpTestingController: HttpTestingController,
      valueService: ValueService) => {

      const body = 'body';

      valueService.readValue(undefined!).pipe(
        tap((data: ValueDetails[]) => {
          fail('should not respond');
        }),
        catchError(err => {
          expect(err).toMatch(err);
          return of(null); // failure is the expected test result
        })).toPromise();
    }));

  it('should call readValues but status fails on PropertyId undefined',
    inject([HttpTestingController, ValueService], (httpTestingController: HttpTestingController,
      valueService: ValueService) => {

      const body = 'body';

      valueService.readValues(undefined!).pipe(
        tap((data: ValueDetails[]) => {
          expect(data).toEqual([]);
        }),
        catchError(err => {
          expect(err).toMatch(err);
          return of(null); // failure is the expected test result
        })).toPromise();
    }));

  it('check that readValue fails ',
    inject([HttpTestingController, ValueService], (httpTestingController: HttpTestingController, valueService: ValueService) => {

      const msg = '404';
      valueService.readValue('OriginalObjectOrPropertyId').subscribe(
        (data: ValueDetails[]) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/values/OriginalObjectOrPropertyId');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('check that readValues fails ',
    inject([HttpTestingController, ValueService], (httpTestingController: HttpTestingController, valueService: ValueService) => {

      const msg = '404';
      valueService.readValues(['OriginalObjectOrPropertyId', 'OriginalObjectOrPropertyId2']).subscribe(
        (data: ValueDetails[]) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/values/');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

});
