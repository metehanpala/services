import { HttpErrorResponse, HttpParams, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ObjectAttributes } from '../wsi-proxy-api/shared/data.model';
import { BrowserObject, Page,
  SearchOption, SystemBrowserSubscription, SystemBrowserSubscriptionKey, ViewNode } from '../wsi-proxy-api/system-browser/data.model';
import { SystemBrowserService } from './system-browser.service';

/* eslint-disable @typescript-eslint/naming-convention */

class RouterStub {}

// Tests  /////////////
describe('SystemBrowserService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'http://CH1W80106.ad001.siemens.net:80' },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        SystemBrowserService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should call getViews()',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const viewNodes: ViewNode[] = [
        {
          Name: 'Name',
          Designation: 'Designation',
          Descriptor: 'Descriptor',
          SystemId: 1,
          SystemName: 'SystemName',
          ViewId: 1,
          ViewType: 0
        },
        {
          Name: 'Name',
          Designation: 'Designation',
          Descriptor: 'Descriptor',
          SystemId: 2,
          SystemName: 'SystemName',
          ViewId: 2,
          ViewType: 0
        }
      ];

      systemBrowserService.getViews()
        .subscribe(
          (views: ViewNode[]) => expect(views).toBe(viewNodes),
          error => error as any);

      // languageService should have made one request to GET getUserLanguage
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/systembrowser/');

      req.flush(viewNodes);
      httpTestingController.verify();
    }
    ));

  it('should call getViews() with systemId',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const viewNodes: ViewNode[] = [
        {
          Name: 'Name 1',
          Designation: 'Designation 1',
          Descriptor: 'Descriptor 1',
          SystemId: 1,
          SystemName: 'SystemName 1',
          ViewId: 1,
          ViewType: 0
        },
        {
          Name: 'Name 2',
          Designation: 'Designation 2',
          Descriptor: 'Descriptor 2',
          SystemId: 1,
          SystemName: 'SystemName 2',
          ViewId: 2,
          ViewType: 0
        }
      ];

      systemBrowserService.getViews(1).subscribe(
        (views: ViewNode[]) => expect(views).toBe(viewNodes),
        error => error as any);

      // workaround provided by https://github.com/angular/angular/issues/19974
      // since there is a open Issue related to httpClient with params
      // Initialize Params Object
      let params: HttpParams = new HttpParams();
      // Begin assigning parameters
      params = params.set('systemId', '1');

      const req: TestRequest =
          httpTestingController.expectOne(data => data.url === 'protocol://site:port/host/api/systembrowser/' && data.params.has('systemId'));

      req.flush(viewNodes);
      httpTestingController.verify();
    }));

  it('should call getNodes()',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const objectAttributes: ObjectAttributes[] =
        [
          {
            Alias: 'alias',
            DefaultProperty: 'defaultProperty',
            DisciplineDescriptor: 'disciplineDescriptor',
            DisciplineId: 1,
            FunctionName: 'functionName',
            ManagedType: 1,
            ManagedTypeName: 'managedTypeName',
            ObjectId: 'objectId',
            SubDisciplineDescriptor: 'subDisciplineDescriptor',
            SubDisciplineId: 1,
            SubTypeDescriptor: 'subTypeDescriptor',
            SubTypeId: 1,
            TypeDescriptor: 'typeDescriptor',
            TypeId: 1,
            ObjectModelName: 'objectModelName'
          },
          {
            Alias: 'alias2',
            DefaultProperty: 'defaultProperty',
            DisciplineDescriptor: 'disciplineDescriptor',
            DisciplineId: 2,
            FunctionName: 'functionName',
            ManagedType: 1,
            ManagedTypeName: 'managedTypeName',
            ObjectId: 'objectId',
            SubDisciplineDescriptor: 'subDisciplineDescriptor',
            SubDisciplineId: 2,
            SubTypeDescriptor: 'subTypeDescriptor',
            SubTypeId: 2,
            TypeDescriptor: 'typeDescriptor',
            TypeId: 2,
            ObjectModelName: 'objectModelName'
          }
        ];

      const browserObjects: BrowserObject[] = [
        {
          Attributes: objectAttributes[0],
          Descriptor: 'Descriptor',
          Designation: 'Designation',
          HasChild: true,
          Name: 'Name',
          Location: 'Location',
          ObjectId: 'ObjectId',
          SystemId: 1,
          ViewId: 1,
          ViewType: 0
        },
        {
          Attributes: objectAttributes[1],
          Descriptor: 'Descriptor',
          Designation: 'Designation',
          HasChild: true,
          Name: 'Name',
          Location: 'Location',
          ObjectId: 'ObjectId',
          SystemId: 2,
          ViewId: 2,
          ViewType: 0
        }
      ];

      systemBrowserService.getNodes(1, 1, 'parentNode')
        .subscribe(
          (views: BrowserObject[]) => expect(views).toBe(browserObjects),
          error => error as any);

      // languageService should have made one request to GET getUserLanguage
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/systembrowser/1/1/parentNode?searchOption=1');

      req.flush(browserObjects);
      httpTestingController.verify();
    }
    ));

  it('should call getNodes() and throw error',
    inject([SystemBrowserService], (systemBrowserService: SystemBrowserService) => {

      systemBrowserService.getNodes(undefined!, 1, 'parentNode').pipe(
        tap((data: BrowserObject[]) => {
          fail('should not respond');
        }),
        catchError(err => {
          expect(err).toMatch(err);
          return of(null); // failure is the expected test result
        })).toPromise();
    }
    ));

  it('should call getNodes() and fails',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const msg = '404';
      systemBrowserService.getNodes(1, 1, 'parentNode').subscribe(
        (data: BrowserObject[]) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/systembrowser/1/1/parentNode?searchOption=1');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('should call searchNodes()',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const objectAttributes: ObjectAttributes[] =
        [
          {
            Alias: 'alias',
            DefaultProperty: 'defaultProperty',
            DisciplineDescriptor: 'disciplineDescriptor',
            DisciplineId: 1,
            FunctionName: 'functionName',
            ManagedType: 1,
            ManagedTypeName: 'managedTypeName',
            ObjectId: 'objectId',
            SubDisciplineDescriptor: 'subDisciplineDescriptor',
            SubDisciplineId: 1,
            SubTypeDescriptor: 'subTypeDescriptor',
            SubTypeId: 1,
            TypeDescriptor: 'typeDescriptor',
            TypeId: 1,
            ObjectModelName: 'objectModelName'
          },
          {
            Alias: 'alias2',
            DefaultProperty: 'defaultProperty',
            DisciplineDescriptor: 'disciplineDescriptor',
            DisciplineId: 2,
            FunctionName: 'functionName',
            ManagedType: 1,
            ManagedTypeName: 'managedTypeName',
            ObjectId: 'objectId',
            SubDisciplineDescriptor: 'subDisciplineDescriptor',
            SubDisciplineId: 2,
            SubTypeDescriptor: 'subTypeDescriptor',
            SubTypeId: 2,
            TypeDescriptor: 'typeDescriptor',
            TypeId: 2,
            ObjectModelName: 'objectModelName'
          }
        ];

      const browserObjects: BrowserObject[] = [
        {
          Attributes: objectAttributes[0],
          Descriptor: 'Descriptor',
          Designation: 'Designation',
          HasChild: true,
          Name: 'Name',
          Location: 'Location',
          ObjectId: 'ObjectId',
          SystemId: 1,
          ViewId: 1,
          ViewType: 0
        },
        {
          Attributes: objectAttributes[1],
          Descriptor: 'Descriptor',
          Designation: 'Designation',
          HasChild: true,
          Name: 'Name',
          Location: 'Location',
          ObjectId: 'ObjectId',
          SystemId: 2,
          ViewId: 2,
          ViewType: 0
        }
      ];

      const pages: Page[] = [
        {
          Nodes: browserObjects,
          Page: 1,
          Size: 1,
          Total: 1
        },
        {
          Nodes: browserObjects,
          Page: 2,
          Size: 2,
          Total: 2
        }
      ];

      systemBrowserService.searchNodes(1, 'searchString')
        .subscribe(
          (data: Page) => expect(data).toBe(pages[0]),
          error => error as any);

      let params: HttpParams = new HttpParams({
        encoder: new WsiQueryEncoder()
      });
      params = params.append('searchString', 'searchString');
      const reqParams: TestRequest = httpTestingController.expectOne(data => data.params.has('searchString'));

      reqParams.flush(pages[0]);
      httpTestingController.verify();

    }));

  it('should call searchNodes() and fails with valid viewId',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const msg = '404';
      systemBrowserService.searchNodes(1, 'searchString', 1).subscribe(
        (data: Page) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      // imageService service should have made one request to GET getImage
      // workaround provided by https://github.com/angular/angular/issues/19974
      // since there is a open Issue related to httpClient with params
      let params: HttpParams = new HttpParams();
      // Begin assigning parameters
      params = params.append('searchString', 'searchString');
      const reqParams: TestRequest = httpTestingController.expectOne(data => data.params.has('searchString'));

      // respond with a 404 and the error message in the body
      reqParams.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('should call searchNodes() and fails',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const msg = '404';
      systemBrowserService.searchNodes(
        1, 'searchString', 1, SearchOption.alias, true, true, 1, 1, 'disciplineFilter', 'objectTypeFilter', true, 'aliasFilter').
        subscribe(
          (data: Page) => fail('expected that %s to fail: ' + data),
          (error: HttpErrorResponse) => expect(error.message).toContain(msg)
        );

      // imageService service should have made one request to GET getImage
      // workaround provided by https://github.com/angular/angular/issues/19974
      // since there is a open Issue related to httpClient with params
      let params: HttpParams = new HttpParams();
      // Begin assigning parameters
      params = params.append('searchString', 'searchString');
      const reqParams: TestRequest = httpTestingController.expectOne(data => data.params.has('searchString'));

      // respond with a 404 and the error message in the body
      reqParams.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('should call searchNodes() and throw error',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      systemBrowserService.searchNodes(undefined!, 'searchString').pipe(
        tap((data: Page) => {
          fail('should not respond');
        }),
        catchError(err => {
          expect(err).toMatch(err);
          return of(null); // failure is the expected test result
        })).toPromise();
    }
    ));

  it('should call subscribeNodeChanges()',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      const systemBrowserSubscriptionKeys: SystemBrowserSubscriptionKey[] = [
        {
          Key: 1,
          Designations: ['Designations', 'Designations'],
          ErrorCode: 1,
          RequestId: 'des',
          RequestFor: undefined!
        },
        {
          Key: 2,
          Designations: ['Designations', 'Designations'],
          ErrorCode: 2,
          RequestId: 'des',
          RequestFor: undefined!
        }
      ];

      systemBrowserService.subscribeNodeChanges(systemBrowserSubscriptionKeys[0].Designations)
        .subscribe(
          (data: SystemBrowserSubscriptionKey) => expect(data).toBe(systemBrowserSubscriptionKeys[0]),
          error => error as any);

      // systemBrowserService should have made one request to GET subscribeNodeChanges
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/sr/systembrowsersubscriptions/TestClientConnectionId');

      req.flush(systemBrowserSubscriptionKeys[0]);
      httpTestingController.verify();

    }));

  it('should call nodeChangeNotification()',
    inject([SystemBrowserService], (systemBrowserService: SystemBrowserService) => {

      systemBrowserService.nodeChangeNotification()
        .subscribe(
          (data: SystemBrowserSubscription) => {
            systemBrowserService.nodeChangeNotification().subscribe((systemBrowserSubscription: SystemBrowserSubscription) =>
              expect(systemBrowserSubscription).toBe(data), error => error as any);
          },
          error => error as any);
    }
    ));

  // it("should call subscribeNodeChanges() with hubConnection started",
  //   inject([XHRBackend, SystemBrowserService, TraceService, NgZone],
  //     (mockBackend: MockBackend, systemBrowserService: SystemBrowserService, traceService: TraceService, ngZone: NgZone) => {

  //     let systemBrowserSubscriptionKeys: SystemBrowserSubscriptionKey[] = [
  //       {
  //        Key: 1,
  //         Designations: ["Designations", "Designations"],
  //         ErrorCode: 1
  //       },
  //       {
  //         Key: 2,
  //         Designations: ["Designations", "Designations"],
  //         ErrorCode: 2
  //       }
  //     ];

  //     let hubConnection: HubConnection = new HubConnection(traceService, "id", ngZone);

  //     hubConnection.initHubConnection("http://CH1W80106.ad001.siemens.net:80/WSI/signalr");

  //     let resp: Response = new Response(new ResponseOptions({status: 200, body: systemBrowserSubscriptionKeys[0]}));
  //     mockBackend.connections.subscribe((c: MockConnection) => c.mockRespond(resp));

  //     hubConnection.startHubConnection();

  //     systemBrowserService.subscribeNodeChanges(systemBrowserSubscriptionKeys[0].Designations)
  //     .subscribe(
  //     (data: SystemBrowserSubscriptionKey) => expect(data).toBe(systemBrowserSubscriptionKeys[0]),
  //     error => <any>error);
  //   }
  // ));

  it('should call subscribeNodeChanges() and throw error',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {

      systemBrowserService.subscribeNodeChanges(null!).pipe(
        tap((data: SystemBrowserSubscriptionKey) => {
          fail('should not respond');
        }),
        catchError(err => {
          expect(err).toMatch(err);
          return of(null); // failure is the expected test result
        })).toPromise();
    }
    ));

  it('check that searchViewNodeMultiple is called',
    inject([HttpTestingController, SystemBrowserService], (httpTestingController: HttpTestingController, systemBrowserService: SystemBrowserService) => {
      const deviceIdArr: string[] = ['ObjectId'];
      const systemId: any = 1;
      const viewId = 10;

      systemBrowserService.searchViewNodeMultiple(systemId, viewId, deviceIdArr).subscribe(
        (data: any) => expect(data).toBe('body'),
        error => error as any);

      const testUrl = 'protocol://site:port/host/api/systembrowser/' + systemId + '/' + viewId;
      const req: TestRequest = httpTestingController.expectOne(testUrl, 'Failed for request url: ' + testUrl);

      req.flush('body');
      httpTestingController.verify();
    }
    )
  );
});

/* eslint-enable @typescript-eslint/naming-convention */
