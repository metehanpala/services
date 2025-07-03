import { HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { fakeAsync, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Subject } from 'rxjs';

import { SubscribeContextChannelizedSingle } from '../public-api';
import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ConnectionState, UserAccount, UserRolesServiceProxyBase, WsiUserRolesRes } from '../wsi-proxy-api';
import { EventCounterProxyServiceBase } from '../wsi-proxy-api/event/event-counter-proxy.service.base';
import { UserRolesServiceProxy } from './user-roles.service-proxy';
import { userAccount, userRoles, wsiUserRoles } from './user-roles.test.models';

const userRolesEndpoint = '/api/accessrights/roles';
const userRolesUpdateEndpoint = '/api/accessrights/updateuserroles';
const subscriptionChannelizeUrl = '/api/sr/accessrightssubscriptions/channelize/';
const subDeleteUrl = '/api/sr/accessrightssubscriptions/';
const textUnsubscribeUserRoles = 'unsubscribeUserRoles()';

class RouterStub {}
// Tests  /////////////
describe('UserRolesServiceProxy', () => {

  const counter = 0;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        // { provide: 'wsiSettingFilePath', useValue: 'http://CH1W80106.ad001.siemens.net:80' },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        { provide: UserRolesServiceProxyBase, useClass: UserRolesServiceProxy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should call getUserRoles and receive user roles',
    inject([HttpTestingController, UserRolesServiceProxyBase],
      (httpTestingController: HttpTestingController, userRoleServiceProxy: UserRolesServiceProxyBase) => {

        userRoleServiceProxy.getUserRoles()
          .subscribe(
            (result: WsiUserRolesRes) => expect(result).toBe(wsiUserRoles),
            error => fail(error)
          );

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/accessrights/roles');

        // Set http response data
        req.flush(wsiUserRoles);
      }
    ));

  it('should call getUserRoles and fail',
    inject([HttpTestingController, UserRolesServiceProxyBase],
      (httpTestingController: HttpTestingController, userRoleServiceProxy: UserRolesServiceProxyBase) => {

        const msg = '404';
        userRoleServiceProxy.getUserRoles()
          .subscribe(
            (result: WsiUserRolesRes) => expect(result).toBe(wsiUserRoles),
            (error: HttpErrorResponse) => expect(error.message).toContain(msg)
          );

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/accessrights/roles');

        // respond with a 404 and the error message in the body
        req.flush(msg, { status: 404, statusText: 'Not Found' });
      }
    ));

  it('Should return void observable',
    (inject([HttpTestingController, UserRolesServiceProxyBase],
      (httpTestingController: HttpTestingController, userRoleServiceProxy: UserRolesServiceProxyBase) => {
        userRoleServiceProxy.userRolesNotification().subscribe(result => {
          expect(result).toEqual(null!);
        });
      })));

  it('should call updateUserRoles and receive userAccount',
    inject([HttpTestingController, UserRolesServiceProxyBase],
      (httpTestingController: HttpTestingController, userRoleServiceProxy: UserRolesServiceProxyBase) => {

        userRoleServiceProxy.updateUserRoles(wsiUserRoles)
          .subscribe(
            (result: UserAccount) => expect(result).toBe(userAccount),
            error => fail(error)
          );

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/accessrights/updateuserroles');

        // Set http response data
        req.flush(userAccount);
      }
    ));

  it('should call updateUserRoles and fail',
    inject([HttpTestingController, UserRolesServiceProxyBase],
      (httpTestingController: HttpTestingController, userRoleServiceProxy: UserRolesServiceProxyBase) => {

        const msg = '404';

        userRoleServiceProxy.updateUserRoles(wsiUserRoles)
          .subscribe(
            (result: UserAccount) => expect(result).toBe(userAccount),
            (error: HttpErrorResponse) => expect(error.message).toContain(msg)
          );

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/accessrights/updateuserroles');

        // Set http response data
        // respond with a 404 and the error message in the body
        req.flush(msg, { status: 404, statusText: 'Not Found' });
      }
    ));

  it('should call subscribeUserRoles and receive response',
    inject([UserRolesServiceProxyBase, HttpTestingController, SignalRService, WsiEndpointService],
      (userRoleServiceProxy: UserRolesServiceProxyBase,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {
        const urlStart = wsiEndpointService.entryPoint + subscriptionChannelizeUrl;

        userRoleServiceProxy.subscribeUserRoles()
          .subscribe(
            (result: any) => expect(result).toEqual({ one: 1 }),
            error => fail(error)
          );

        const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
          request.url.startsWith(urlStart));
        expect(req.request.method).toBe('POST');
        req.flush({ one: 1 });

        const proxy: HubProxyEvent<any> = mockSignalRService.getNorisHub().proxies[0];

        /* eslint-disable @typescript-eslint/naming-convention */
        const subscription: any = {
          ErrorCode: 0,
          RequestId: (counter - 1).toString(),
          RequestFor: 'notifyRolesChange'
        };
        /* eslint-enable @typescript-eslint/naming-convention */

        proxy.notifyEvents(subscription);
      }
    ));

  it('should call unsubscribeUserRoles and receive response',
    inject([UserRolesServiceProxyBase, HttpTestingController, SignalRService, WsiEndpointService],
      (userRoleServiceProxy: UserRolesServiceProxyBase,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {
        const url: string = wsiEndpointService.entryPoint + subDeleteUrl + 'TestClientConnectionId/userroles';

        userRoleServiceProxy.unsubscribeUserRoles()
          .subscribe(
            (result: any) => expect(result).toBe(true),
            error => expect(error instanceof Error).toBe(true)
          );

        const req: TestRequest = httpTestingController.expectOne(url);
        expect(req.request.method).toBe('DELETE');
        const result = true;
        req.event(new HttpResponse<boolean>({ body: true }));
      }
    ));

  it('should call unsubscribeUserRoles and fail',
    inject([UserRolesServiceProxyBase, HttpTestingController, SignalRService, WsiEndpointService],
      (userRoleServiceProxy: UserRolesServiceProxyBase,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {
        const url: string = wsiEndpointService.entryPoint + subDeleteUrl + 'TestClientConnectionId/userroles';

        const msg = '404';

        userRoleServiceProxy.unsubscribeUserRoles()
          .subscribe(
            (result: any) => expect(result).toBe(true),
            (error: HttpErrorResponse) => expect(error.message).toContain(msg)
          );

        const req: TestRequest = httpTestingController.expectOne(url);
        expect(req.request.method).toBe('DELETE');
        const result = true;
        req.flush(msg, { status: 404, statusText: 'Not Found' });
      }
    ));

  it('Private method userRolesSubscriptionPost should return true',
    inject([UserRolesServiceProxyBase, HttpTestingController, SignalRService, WsiEndpointService],
      (userRoleServiceProxy: any,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        const url: string = wsiEndpointService.entryPoint + subscriptionChannelizeUrl +
        userRoleServiceProxy.ctx.id + '/' + userRoleServiceProxy.hubProxyShared.connectionId;
        const body: any = JSON.stringify({ });
        const headers: HttpHeaders = userRoleServiceProxy.wsiUtilityService.httpPostDefaultHeader(userRoleServiceProxy.authenticationServiceBase.userToken);

        userRoleServiceProxy.userRolesSubscriptionPost(url, body, headers)
          .subscribe(
            (result: boolean) => expect(result).toBeTrue(),
            (error: any) => fail(error)
          );

        const req: TestRequest = httpTestingController.expectOne(url);

        // Set http response data
        req.flush(true);
      }
    ));

  it('Private method userRolesSubscriptionPost should fail and return message',
    inject([UserRolesServiceProxyBase, HttpTestingController, SignalRService, WsiEndpointService],
      (userRoleServiceProxy: any,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        const msg = '404';
        const url: string = wsiEndpointService.entryPoint + subscriptionChannelizeUrl +
        userRoleServiceProxy.ctx.id + '/' + userRoleServiceProxy.hubProxyShared.connectionId;
        const body: any = JSON.stringify({ });
        const headers: HttpHeaders = userRoleServiceProxy.wsiUtilityService.httpPostDefaultHeader(userRoleServiceProxy.authenticationServiceBase.userToken);

        userRoleServiceProxy.userRolesSubscriptionPost(url, body, headers)
          .subscribe(
            (result: boolean) => expect(result).toBeTrue(),
            (error: HttpErrorResponse) => expect(error.message).toContain(msg)
          );

        const req: TestRequest = httpTestingController.expectOne(url);

        // respond with a 404 and the error message in the body
        req.flush(msg, { status: 404, statusText: 'Not Found' });
      }
    ));

  it('Private method userRolesUnsubscribeDelete should return true',
    inject([UserRolesServiceProxyBase, HttpTestingController, SignalRService, WsiEndpointService],
      (userRoleServiceProxy: any,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        const url: string = wsiEndpointService.entryPoint + subscriptionChannelizeUrl +
        userRoleServiceProxy.ctx.id + '/' + userRoleServiceProxy.hubProxyShared.connectionId;
        const body: any = JSON.stringify({ });
        const headers: HttpHeaders = userRoleServiceProxy.wsiUtilityService.httpPostDefaultHeader(userRoleServiceProxy.authenticationServiceBase.userToken);

        userRoleServiceProxy.userRolesUnsubscribeDelete(url, body, headers)
          .subscribe(
            (result: boolean) => expect(result).toBeTrue(),
            (error: any) => fail(error)
          );

        const req: TestRequest = httpTestingController.expectOne(url);

        // Set http response data
        req.flush(true);
      }
    ));

  it('Private method userRolesUnsubscribeDelete should fail and return message',
    inject([UserRolesServiceProxyBase, HttpTestingController, SignalRService, WsiEndpointService],
      (userRoleServiceProxy: any,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {

        const msg = '404';
        const url: string = wsiEndpointService.entryPoint + subscriptionChannelizeUrl +
        userRoleServiceProxy.ctx.id + '/' + userRoleServiceProxy.hubProxyShared.connectionId;
        const body: any = JSON.stringify({ });
        const headers: HttpHeaders = userRoleServiceProxy.wsiUtilityService.httpPostDefaultHeader(userRoleServiceProxy.authenticationServiceBase.userToken);

        userRoleServiceProxy.userRolesUnsubscribeDelete(url, body, headers)
          .subscribe(
            (result: boolean) => expect(result).toBeTrue(),
            (error: HttpErrorResponse) => expect(error.message).toContain(msg)
          );

        const req: TestRequest = httpTestingController.expectOne(url);

        // respond with a 404 and the error message in the body
        req.flush(msg, { status: 404, statusText: 'Not Found' });
      }
    ));

});
