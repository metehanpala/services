import { HttpErrorResponse, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Injector } from '@angular/core';
import { discardPeriodicTasks, fakeAsync, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppSettingsService,
  Credentials,
  HfwServicesCommonModule,
  MockAppSettingsService,
  MockProductService,
  MockTraceService,
  MockWsiEndpointService,
  ProductService,
  TraceService,
  UserInfoStorage } from '@gms-flex/services-common';
import { CookieService } from 'ngx-cookie-service';
import { of } from 'rxjs';

import { GmsServicesModule } from '../gms-services.module';
import { SiIconMapperService } from '../icons-mapper/si-icon-mapper.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { AuthenticationService } from './authentication.service';

class RouterStub {
  private navigate(commands: any[]): any[] { return commands; }
}

class MockSiIconMapperService {
  public getTablesData(): any {
    return of(null);
  }
}

// Tests  /////////////
describe('Authentication Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GmsServicesModule, HfwServicesCommonModule],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        Injector,
        { provide: 'appSettingFilePath', useValue: 'app-settings.json' },
        { provide: 'productSettingFilePath', useValue: 'config/product-settings.json' },
        { provide: 'wsiSettingFilePath', useValue: 'config/wsi-endpoint-settings.json' },
        { provide: 'tablesDataPath', useValue: 'config/text-groups-and-json.json' },
        { provide: AppSettingsService, useClass: MockAppSettingsService },
        { provide: ProductService, useClass: MockProductService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: SiIconMapperService, useClass: MockSiIconMapperService },
        CookieService,
        AuthenticationService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create Authentication Service',
    inject([AuthenticationService], (authenticationService: AuthenticationService) => {
      expect(authenticationService instanceof AuthenticationService).toBe(true);
    }));

  it('check that Authentication has Token undefined at Constructor Time ',
    inject([AuthenticationService, CookieService], (authenticationService: AuthenticationService, cookieService: CookieService) => {
      if (cookieService.get(UserInfoStorage.UserTokenKey)) {
        expect(authenticationService.userToken).toBe('TEST_TOKEN');
      } else {
        expect(authenticationService.userToken).toBeUndefined();
      }
    }));

  xit('check that Authentication login works ',
    inject([HttpTestingController, AuthenticationService, CookieService],
      (httpTestingController: HttpTestingController, authenticationService: AuthenticationService, cookieService: CookieService) => {

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const body: any = { access_token: 'TEST_TOKEN' };

        const status = 200;

        const statusText = 'OK';

        const loginCredentials: Credentials = {
          username: 'test@example.com',
          password: '1234'
        };

        cookieService.delete(UserInfoStorage.UserTokenKey);
        cookieService.delete(UserInfoStorage.UserNameKey);
        cookieService.delete(UserInfoStorage.UserProfileKey);
        cookieService.delete(UserInfoStorage.UserDescriptorKey);
        cookieService.delete(UserInfoStorage.UserInactivityKey);

        authenticationService.login(loginCredentials).
          subscribe((data: string) => {
            expect(data).toBe(body.access_token);
          });

        // authenticationService should have made one request to GET login
        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/token');

        // Expect server to return the login after GET
        const expectedResponse: HttpResponse<any> = new HttpResponse(
          { status: 200, statusText: 'OK', body });
        req.event(expectedResponse);

        req.flush(body);
        httpTestingController.verify();

      }));

  it('check that Authentication login fails ',
    inject([HttpTestingController, AuthenticationService, CookieService],
      (httpTestingController: HttpTestingController, authenticationService: AuthenticationService, cookieService: CookieService) => {

        const loginCredentials: Credentials = {
          username: 'test@example.com',
          password: '1234'
        };

        const msg = '404';
        cookieService.delete(UserInfoStorage.UserTokenKey);
        cookieService.delete(UserInfoStorage.UserNameKey);
        cookieService.delete(UserInfoStorage.UserProfileKey);
        cookieService.delete(UserInfoStorage.UserDescriptorKey);
        cookieService.delete(UserInfoStorage.UserInactivityKey);
        authenticationService.login(loginCredentials).subscribe(
          (data: string) => fail('expected that %s to fail: ' + data),
          (error: HttpErrorResponse) => expect(error.message).toContain(msg)
        );

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/token');

        // respond with a 404 and the error message in the body
        req.flush(msg, { status: 404, statusText: 'Not Found' });

      }));

  it('check that Authentication login fails with error 401',
    inject([HttpTestingController, AuthenticationService, CookieService], (
      httpTestingController: HttpTestingController, authenticationService: AuthenticationService, cookieService: CookieService) => {

      const loginCredentials: Credentials = {
        username: 'test@example.com',
        password: '1234'
      };

      cookieService.delete(UserInfoStorage.UserTokenKey);
      cookieService.delete(UserInfoStorage.UserNameKey);
      cookieService.delete(UserInfoStorage.UserProfileKey);
      cookieService.delete(UserInfoStorage.UserDescriptorKey);
      cookieService.delete(UserInfoStorage.UserInactivityKey);

      const msg = 'The user token is invalid';
      authenticationService.login(loginCredentials).subscribe(
        (data: string) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/token');

      // no need of flush message
      // req.flush(msg, {status: 401, statusText: "WSI reply error! See trace."});

    }));

  it('check that Authentication login fails with error 403',
    inject([HttpTestingController, AuthenticationService, CookieService], (
      httpTestingController: HttpTestingController, authenticationService: AuthenticationService, cookieService: CookieService) => {

      const loginCredentials: Credentials = {
        username: 'test@example.com',
        password: '1234'
      };

      cookieService.delete(UserInfoStorage.UserTokenKey);
      cookieService.delete(UserInfoStorage.UserNameKey);
      cookieService.delete(UserInfoStorage.UserProfileKey);
      cookieService.delete(UserInfoStorage.UserDescriptorKey);
      cookieService.delete(UserInfoStorage.UserInactivityKey);
      const msg = 'Expired.';
      authenticationService.login(loginCredentials).subscribe(
        (data: string) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.statusText).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/token');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 403, statusText: 'WSI reply error! pwd Expired.' });

    }));

  it('check that Authentication logout works ',
    inject([HttpTestingController, AuthenticationService], (httpTestingController: HttpTestingController, authenticationService: AuthenticationService) => {

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const body: any = { access_token: 'TEST_TOKEN' };

      const status = 200;

      const statusText = 'OK';

      authenticationService.logout(false).
        subscribe((data: boolean) => {
          expect(data).toBe(true);
        });

      // authenticationService should have made one request to GET logout
      // const req: TestRequest = httpTestingController.expectOne("protocol://site:port/host/api/token");

      // Expect server to return the logout after GET
      // const expectedResponse: HttpResponse<any> = new HttpResponse(
      //  { status: 200, statusText: "OK", body: body });
      // req.event(expectedResponse);

      // req.flush(body);
      // httpTestingController.verify();

    }));

  // it("check that Authentication logut fails ",
  //  inject([HttpTestingController, AuthenticationService], (httpTestingController: HttpTestingController, authenticationService: AuthenticationService) => {

  //   const msg: string = "404";
  //         authenticationService.logout().subscribe(
  //     (data: boolean) => fail("expected that %s to fail: " + data),
  //     (error: HttpErrorResponse) => expect(error.message).toContain(msg)
  //   );

  //   const req: TestRequest = httpTestingController.expectOne("protocol://site:port/host/api/token");

  //   // respond with a 404 and the error message in the body
  //   req.flush(msg, {status: 404, statusText: "Not Found"});

  // }));

  xit('check that Authentication login works and call sendHeartbeat', fakeAsync(
    inject([HttpTestingController, AuthenticationService, CookieService], (httpTestingController: HttpTestingController,
      authenticationService: AuthenticationService, cookieService: CookieService) => {

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const body: any = { access_token: 'TEST_TOKEN' };

      const status = 200;

      const statusText = 'OK';

      const loginCredentials: Credentials = {
        username: 'test@example.com',
        password: '1234'
      };

      cookieService.delete(UserInfoStorage.UserTokenKey);
      cookieService.delete(UserInfoStorage.UserNameKey);
      cookieService.delete(UserInfoStorage.UserProfileKey);
      cookieService.delete(UserInfoStorage.UserDescriptorKey);
      cookieService.delete(UserInfoStorage.UserInactivityKey);

      authenticationService.login(loginCredentials).
        subscribe((data: string) => {
          tick(10000);
          discardPeriodicTasks();
          expect(data).toBe(body.access_token);
        });

      // authenticationService should have made one request to GET login
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/token');
      req.flush(body);

      // authenticationService should have made one request to GET login
      const reqHeart: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/heartbeat');
      reqHeart.flush(null);

      httpTestingController.verify();

    })));

});
