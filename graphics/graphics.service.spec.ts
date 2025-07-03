import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { BrowserObject } from '../wsi-proxy-api/system-browser/data.model';
import { GraphicInfo } from './data.model';
import { GraphicsService } from './graphics.service';

/* eslint-disable @typescript-eslint/naming-convention */
const graphicInfos: GraphicInfo[] = [
  {
    Context: 'Designation',
    DisplayName: 'DisplayName',
    ManagedType: 'ManagedType',
    ObjectId: 'ObjectId'
  },
  {
    Context: 'Designation',
    DisplayName: 'DisplayName',
    ManagedType: 'ManagedType',
    ObjectId: 'ObjectId'
  }
];

// Mock browser object of the child object with graphics
const childWithGraphicsBo: BrowserObject = { Designation: 'ChildDesignation'
  , ObjectId: 'ChildObjectId', Descriptor: undefined!, HasChild: false, Name: 'ChildWithGraphics', ViewId: 1
  , Attributes: undefined!, Location: undefined!, SystemId: 1, ViewType: 3 };

/* eslint-enable @typescript-eslint/naming-convention */

class RouterStub {}
// Tests  /////////////
describe('Graphics Service', () => {

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
        GraphicsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create GraphicsService',
    inject([GraphicsService], (graphicsService: GraphicsService) => {
      expect(graphicsService instanceof GraphicsService).toBe(true);
    }
    ));

  it('should call hasGraphicalItems',
    inject([HttpTestingController, GraphicsService], (httpTestingController: HttpTestingController, graphicsService: GraphicsService) => {

      graphicsService.hasGraphicalItems('ObjectId')
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => error as any);

      // graphicsService should have made one request to GET getGraphicsContent
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/graphics/ObjectId');

      httpTestingController.verify();
    }
    ));

  it('should call getGraphicsContent',
    inject([HttpTestingController, GraphicsService], (httpTestingController: HttpTestingController, graphicsService: GraphicsService) => {

      graphicsService.getGraphicsContent('ObjectId')
        .subscribe(
          (data: string) => expect(data).toBe('body'),
          error => error as any);

      // graphicsService should have made one request to GET getGraphicsContent
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/graphics/items/ObjectId');

      req.flush('body');
      httpTestingController.verify();
    }
    ));

  it('should call getGraphicsItems',
    inject([HttpTestingController, GraphicsService], (httpTestingController: HttpTestingController, graphicsService: GraphicsService) => {

      graphicsService.getGraphicsItems('Designation')
        .subscribe(
          (data: GraphicInfo[]) => expect(data).toBe(graphicInfos),
          error => error as any);

      // graphicsService should have made one request to GET getGraphicsItems
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/graphics/itemIds/Designation');

      req.flush(graphicInfos);
      httpTestingController.verify();
    }
    ));

  it('should call getChildWithGraphics',
    inject([HttpTestingController, GraphicsService], (httpTestingController: HttpTestingController, graphicsService: GraphicsService) => {

      graphicsService.getChildWithGraphics('Designation')
        .subscribe(
          (browserObject: BrowserObject) => expect(browserObject).toBe(childWithGraphicsBo),
          error => error as any);

      // graphicsService should have made one request to GET getChildWithGraphics
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/graphics/children/itemIds/Designation?types=7');

      req.flush(childWithGraphicsBo);
      httpTestingController.verify();
    }
    ));
});
