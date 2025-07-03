import { HttpClient, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { fakeAsync, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { NewObjectParameters, ObjectCreationInfo, ServiceTextInfo, ServiceTextParameters } from '../wsi-proxy-api/objects/data.model';
import { BrowserObject } from '../wsi-proxy-api/system-browser/data.model';
import { ObjectsService } from './objects.service';

/* eslint-disable @typescript-eslint/naming-convention */

const createableObjectsMgmt: ObjectCreationInfo = {
  IsGenericDeleteAllowed: false,
  Designation: 'System1.Mike:Mike.Is.Super.Cool',
  Description: 'HTML5 GMS Type Arrays',
  Name: 'HTML5_GMSTypeArrays',
  ChildObjects: []
};

const newGenericItem: NewObjectParameters = {
  Designation: 'TestSystem.TestView:TestView',
  NameChildNode: 'Test_Name_Child_Node',
  ObjectModelName: 'Test_Object_Type',
  Descriptor: { CommonText: 'Test_Descriptor' }
};

/* eslint-enable @typescript-eslint/naming-convention */

const invalidArguments = 'Invalid arguments!';

class RouterStub {}

// Tests  /////////////
describe('Objects Service:', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: HttpClient, useClass: HttpClient },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        { provide: 'productSettingFilePath', useValue: 'noMatter' },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        AuthenticationServiceBase,
        ObjectsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create ObjectsService',
    inject([ObjectsService], (objectsService: ObjectsService) => {
      expect(objectsService instanceof ObjectsService).toBe(true);
    }
    ));

  it('should call getObjectCreationInfo',
    inject([HttpTestingController, ObjectsService], (httpTestingController: HttpTestingController, objectService: ObjectsService) => {

      objectService.getObjectCreationInfo('TestSystem.TestView:TestView')
        .subscribe(
          (response: ObjectCreationInfo) =>
            expect(response).toEqual(createableObjectsMgmt),
          error => error as any);

      const req: TestRequest =
          httpTestingController.expectOne(response => response.method === 'GET' &&
          response.url === 'protocol://site:port/host/api/Objects/TestSystem.TestView%253ATestView');

      req.flush(createableObjectsMgmt);
      httpTestingController.verify();
    })
  );

  it('should call createObject',
    waitForAsync(inject([HttpTestingController, ObjectsService], (httpTestingController: HttpTestingController, objectService: ObjectsService) => {

      // const body: BrowserObject;

      objectService.createObject(newGenericItem)
        .subscribe((response: BrowserObject) => expect(response).toBeDefined(),
          error => error as any);

      // const req: TestRequest =
      //   httpTestingController.expectOne(response => response.method === "POST" && response.url ===  "protocol://site:port/host/api/Objects/");

      // // Expect server to return the ExecuteCommand after GET
      // const expectedResponse: HttpResponse<any> = new HttpResponse(
      //   { status: 200, statusText: "OK", body: body });
      // req.event(expectedResponse);

      // req.flush(body);
      // httpTestingController.verify();
    }))
  );

  it('should call getServiceText - null objectId',
    inject([HttpTestingController, ObjectsService],
      fakeAsync((httpTestingController: HttpTestingController, objectService: ObjectsService) => {

        objectService.getServiceText(null!)
          .subscribe(() => {
            fail('expected an error');
          },
          (error: Error) => {
            expect(error.message).toBe(invalidArguments);
          });
      }))
  );

  it('should call getServiceText - undefined objectId',
    inject([HttpTestingController, ObjectsService],
      fakeAsync((httpTestingController: HttpTestingController, objectService: ObjectsService) => {

        objectService.getServiceText(undefined!)
          .subscribe(() => {
            fail('expected an error');
          },
          (error: Error) => {
            expect(error.message).toBe(invalidArguments);
          });
      }))
  );

  it('should call getServiceText - succeed',
    inject([HttpTestingController, ObjectsService],
      fakeAsync((httpTestingController: HttpTestingController, objectService: ObjectsService) => {

        const objectId = 'ThisIsAnObjectId';

        objectService.getServiceText(objectId)
          .subscribe((response: ServiceTextInfo) => expect(response).toBeDefined(),
            error => error as any);
      }))
  );

  it('should call setServiceText - null objectId',
    inject([HttpTestingController, ObjectsService],
      fakeAsync((httpTestingController: HttpTestingController, objectService: ObjectsService) => {

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const updatedServiceText: ServiceTextParameters = { Memo: 'This is a memo' };

        objectService.setServiceText(undefined!, updatedServiceText)
          .subscribe(() => {
            fail('expected an error');
          },
          (error: Error) => {
            expect(error.message).toBe(invalidArguments);
          });
      }))
  );

  it('should call setServiceText - undefined objectId',
    inject([HttpTestingController, ObjectsService],
      fakeAsync((httpTestingController: HttpTestingController, objectService: ObjectsService) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const updatedServiceText: ServiceTextParameters = { Memo: 'This is a memo' };

        objectService.setServiceText(undefined!, updatedServiceText)
          .subscribe(() => {
            fail('expected an error');
          },
          (error: Error) => {
            expect(error.message).toBe(invalidArguments);
          });
      }))
  );

  it('should call setServiceText - undefined ServiceTextParameters',
    inject([HttpTestingController, ObjectsService],
      fakeAsync((httpTestingController: HttpTestingController, objectService: ObjectsService) => {

        const objectId = 'ThisIsAnObjectId';

        objectService.setServiceText(objectId, undefined!)
          .subscribe(() => {
            fail('expected an error');
          },
          (error: Error) => {
            expect(error.message).toBe(invalidArguments);
          });
      }))
  );

  it('should call setServiceText - succeed',
    inject([HttpTestingController, ObjectsService],
      fakeAsync((httpTestingController: HttpTestingController, objectService: ObjectsService) => {

        const objectId = 'ThisIsAnObjectId';
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const updatedServiceText: ServiceTextParameters = { Memo: 'This is a memo' };
        let iSuccess = false;

        objectService.setServiceText(objectId, updatedServiceText)
          .subscribe(() =>
            iSuccess = true,
          error => fail(error),
          () => expect(iSuccess).toBe(true));
      })));

});
