import { HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  AuthenticationServiceBase, ErrorNotificationServiceBase,
  MockTraceService, MockWsiEndpointService, TraceService
} from '@gms-flex/services-common';
import { throwError } from 'rxjs';

import { ErrorNotificationService, WsiQueryEncoder } from '../shared';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { AppRights } from '../wsi-proxy-api/app-rights/data.model';
import { HistLogColumnDescription, HistLogEnumValues, HistoryLogKind, HistoryLogTable, LinkLog, LogViewResult } from '../wsi-proxy-api/log-viewer/data.model';
import { WsiError } from '../wsi-proxy-api/shared/wsi-error';
import { LogViewerService } from './log-viewer.service';

class RouterStub { }

describe('LogViewerService', () => {
  let logViewerService: LogViewerService;
  let wsiUtilityService: WsiUtilityService;
  let httpTestingController: HttpTestingController;
  let controller: HttpTestingController;
  let extractDataSpy: jasmine.Spy<any>;
  let handleErrorSpy: jasmine.Spy<any>;
  let errorService: ErrorNotificationServiceBase;
  // let logViewResult: LogViewResult[];
  let linkLog: LinkLog[];
  let historyLogData: HistoryLogTable;
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
        LogViewerService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
    wsiUtilityService = TestBed.inject(WsiUtilityService);
    logViewerService = TestBed.inject(LogViewerService);
    httpTestingController = TestBed.inject(HttpTestingController);
    errorService = TestBed.inject(ErrorNotificationServiceBase);
    extractDataSpy = spyOn(wsiUtilityService, 'extractData');
    handleErrorSpy = spyOn(wsiUtilityService, 'handleError');
    /* eslint-disable @typescript-eslint/naming-convention */
    const logViewResult: any = [
      {
        Id: 1,
        EventId: 1,
        Time: 'Time',
        LogType: 'LogType',
        RecordType: 'RecordType',
        AuditFlag: 'AuditFlag',
        UserName: 'UserName',
        Workstation: 'Workstation',
        Action: 'Action',
        Status: 'string',
        Name: 'string',
        Description: 'string',
        InternalName: 'string',
        HiddenInternalName: 'string',
        DefaultViewDesignation: 'string',
        DefaultViewLocation: 'string',
        ManagementDesignation: 'string',
        ManagementLocation: 'string',
        SystemName: 'string',
        Discipline: 'string',
        SubDiscipline: 'string',
        Type: 'string',
        SubType: 'string',
        ValProf: 'string',
        EventCatPrio: 11,
        EventCause: 'string',
        AlertId: 'string',
        AlarmCategory: 'string',
        AlertMode: 'string',
        EventMessageText: 'string',
        AlertTime: 'string',
        AlertState: 'string',
        ObjectPropertyLogView: 'string',
        ObserverObjectPropertyLogView: 'string',
        LogicalDesignation: 'string',
        LogicalLocation: 'string',
        ObserverName: 'string',
        ObserverDescription: 'string',
        ObserverNameInternal: 'string',
        ObserverDefaultHierarchyDesignation: 'string',
        ObserverDefaultHierarchyLocation2: 'string',
        DeviceEventText: 'string',
        ValueDurationTicks: 11,
        Value: 'string',
        ApplicationDesignation: 'string',
        ApplicationLocation: 'string',
        PrevValueDurationTicks: 11,
        PrevValue: 'string',
        MessageText: 'string',
        Error: 'string'
      }];

    linkLog = [{
      Rel: 'rel',
      Href: 'href',
      IsTemplated: false
    }];

    historyLogData = {
      TableName: 'tableName',
      Size: 1,
      Page: 1,
      Result: logViewResult,
      SnapshotId: 'snapshotId',
      Total: 1,
      ErrorInfo: ['string'],
      _links: linkLog
    };
    /* eslint-disable @typescript-eslint/naming-convention */

  }));

  it('can load instance', () => {
    expect(logViewerService).toBeTruthy();
  });

  // //////////////////////////////   getHistoryLogs function  test cases /////////////////////////////////

  it('can retrieve LogViewTable data without params', () => {
    // to stub the call to extract data function now extractDataSpy mimics it
    extractDataSpy.and.returnValue(historyLogData);
    const functionName = 'getHistoryLogs()';
    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);

    logViewerService.getHistoryLogs({ systemId: 1, historyLogKind: HistoryLogKind.LogView })
      .subscribe(
        (data: HistoryLogTable) => {
          // checking if call to the function return the expected  value
          expect(data).toBe(historyLogData);
        });

    const expectedUrl = `${baseUrl}/api/historylogs/1/LogViewTable`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);
    const response = new HttpResponse({
      body: historyLogData,
      headers: new HttpHeaders(),
      status: 200,
      statusText: 'OK',
      url: expectedUrl
    });
    expect(req.request.method).toEqual('POST');

    req.flush(historyLogData);

    // checking if call to extract data is made with correct parameters during mock http call
    expect(extractDataSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http post response`);
    httpTestingController.verify();
  });

  it('can retrieve LogViewTable data using params', () => {
    const toDate = new Date();
    const fromDate = new Date(toDate.getDate() - 1);
    const conditionFilter = '\'Action\'=\'Login\'';
    const nameFilter = ['*'];
    const size = 1;
    const sortColumnData = [{ Name: 'Time', SortType: 'Ascending' }];
    const functionName = 'getHistoryLogs()';
    const apiParams = {
      systemId: 1,
      historyLogKind: HistoryLogKind.LogView,
      fromDate,
      toDate,
      size,
      conditionFilter,
      nameFilter,
      sortColumnData
    };

    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
    extractDataSpy.and.returnValue(historyLogData);

    logViewerService.getHistoryLogs(apiParams)
      .subscribe(data => {
        expect(data).toBe(historyLogData);
      });

    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });
    params = params.append('conditionFilter', conditionFilter);
    params = params.append('size', size.toString());
    params = params.append('fromDate', fromDate.toISOString());
    params = params.append('toDate', toDate.toISOString());
    params = params.append('sortColumnData', JSON.stringify(sortColumnData));
    params = params.append('nameFilter', JSON.stringify(nameFilter));

    const expectedUrl = `${baseUrl}/api/historylogs/1/LogViewTable`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl + '?' + params.toString());
    const response = new HttpResponse({
      body: historyLogData,
      headers: new HttpHeaders(),
      status: 200,
      statusText: 'OK',
      url: expectedUrl + '?' + params.toString()
    });
    expect(req.request.method).toEqual('POST');
    req.flush(historyLogData);
    expect(extractDataSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http post response`);
    httpTestingController.verify();
  });

  it('should throw error for getHistoryLogs() call without systerm id', () => {
    const functionName = 'getHistoryLogs()';
    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
    handleErrorSpy.and.returnValue(throwError(new WsiError('Unauthorized error', 401, 'BadRequest')));

    let errors = '';
    logViewerService.getHistoryLogs({ systemId: undefined!, historyLogKind: HistoryLogKind.LogView })
      .subscribe(
        result => {
          fail('expected that %s to fail: ');
        },
        (error: HttpErrorResponse) => {
          errors = error.message;
          expect(errors.includes('Unauthorized error')).toBeTruthy();
        }
      );

    const expectedUrl = `${baseUrl}/api/historylogs/undefined/LogViewTable`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);
    const headers = new HttpHeaders().append('Accept', 'text/html,application/json');

    req.error(new ErrorEvent('Unauthorized error'), {
      status: 401,
      statusText: 'BadRequest'
    });

    const response = new HttpErrorResponse({
      error: new ErrorEvent('Unauthorized error'),
      headers: new HttpHeaders(),
      status: 401,
      statusText: 'BadRequest',
      url: expectedUrl
    });

    expect(handleErrorSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http post response`, errorService);
    httpTestingController.verify();
  });

  it('should throw error for getHistoryLogs() call without systerm id', () => {
    const functionName = 'getHistoryLogs()';
    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
    handleErrorSpy.and.returnValue(throwError(new WsiError('Unauthorized error', 401, 'BadRequest')));

    let errors = '';
    logViewerService.getHistoryLogs({ systemId: undefined!, historyLogKind: HistoryLogKind.LogView })
      .subscribe(
        result => {
          fail('expected that %s to fail: ');
        },
        (error: HttpErrorResponse) => {
          errors = error.message;
          expect(errors.includes('Unauthorized error')).toBeTruthy();
        }
      );

    const expectedUrl = `${baseUrl}/api/historylogs/undefined/LogViewTable`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);

    req.error(new ErrorEvent('Unauthorized error'), {
      status: 401,
      statusText: 'BadRequest'
    });

    const response = new HttpErrorResponse({
      error: new ErrorEvent('Unauthorized error'),
      headers: new HttpHeaders(),
      status: 401,
      statusText: 'BadRequest',
      url: expectedUrl
    });
    expect(handleErrorSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http post response`, errorService);

    httpTestingController.verify();
  });
  // //////////////////////////////////////////////////////////////////

  // getHistoryLogColumnDescripton  test cases

  it('can retrieve getHistoryLogColumnDescripton data',
    () => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const histLogColumnDescription: HistLogColumnDescription[] = [
        {
          Name: 'Name',
          Descriptor: 'Descriptor',
          DataType: 'DataType',
          ErrorSupport: true,
          IsArray: true,
          IsDefault: true,
          IsHidden: true,
          IsSortable: true,
          IsEnum: true,
          IsFilterable: true
        }];
      /* eslint-disable @typescript-eslint/naming-convention */
      // to stub the call to extract data function now extractDataSpy mimics it
      extractDataSpy.and.returnValue(histLogColumnDescription);
      const functionName = 'getHistoryLogColumnDescripton()';
      const wsiEndpointService = TestBed.inject(WsiEndpointService);
      const baseUrl = 'https://test-server.com';
      spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);

      logViewerService.getHistoryLogColumnDescripton(1, HistoryLogKind.LogView)
        .subscribe(
          (data: HistLogColumnDescription[]) => {
            // checking if call to the function return the expected  value
            expect(data).toBe(histLogColumnDescription);
          });

      const expectedUrl = `${baseUrl}/api/historylogs/1/LogViewTable`;
      const req: TestRequest = httpTestingController.expectOne(expectedUrl);
      const response = new HttpResponse({
        body: histLogColumnDescription,
        headers: new HttpHeaders(),
        status: 200,
        statusText: 'OK',
        url: expectedUrl
      });

      expect(req.request.method).toEqual('GET');

      req.flush(histLogColumnDescription);
      // checking if call to extract data is made with correct parameters during mock http call
      expect(extractDataSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http get response`);
      httpTestingController.verify();
    });

  it('should throw error for getHistoryLogColumnDescripton() call  without systerm id',
    () => {
      let errors = '';
      const functionName = 'getHistoryLogColumnDescripton()';
      const wsiEndpointService = TestBed.inject(WsiEndpointService);
      const baseUrl = 'https://test-server.com';
      spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
      handleErrorSpy.and.returnValue(throwError(new WsiError('Unauthorized error', 401, 'BadRequest')));
      logViewerService.getHistoryLogColumnDescripton(undefined!, HistoryLogKind.LogView)
        .subscribe(result => {
          fail('expected that %s to fail: ');
        },
        (error: HttpErrorResponse) => {
          errors = error.message;
          expect(errors.includes('Unauthorized error')).toBeTruthy();
        }
        );

      const expectedUrl = `${baseUrl}/api/historylogs/undefined/LogViewTable`;
      const req: TestRequest = httpTestingController.expectOne(expectedUrl);
      let headers: HttpHeaders = new HttpHeaders();
      headers = headers.append(
        'Accept',
        'text/html,application/json'
      );

      req.error(new ErrorEvent('Unauthorized error'), {
        status: 401,
        statusText: 'BadRequest'
      });
      const response = new HttpErrorResponse({
        error: new ErrorEvent('Unauthorized error'),
        headers: new HttpHeaders(),
        status: 401,
        statusText: 'BadRequest',
        url: expectedUrl
      });
      expect(handleErrorSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http get response`, errorService);
      httpTestingController.verify();
    });

  // ////////////////////////////////////////////////////////////////////////////////////////////////

  // //////////////////////////////// getHistoryLogEnumValues  test cases//////////////////////////////////////

  it('can retrieve getHistoryLogEnumValues data', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const histLogEnumValues: HistLogEnumValues = {
      EnumValues: [
        'Data1', 'Data2']
    };
    /* eslint-disable @typescript-eslint/naming-convention */

    // to stub the call to extract data function now extractDataSpy mimics it
    extractDataSpy.and.returnValue(histLogEnumValues);
    const functionName = 'getHistoryLogEnumValues()';
    const columnName = 'RecordType';
    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);

    logViewerService.getHistoryLogEnumValues(1, HistoryLogKind.LogView, columnName)
      .subscribe(
        (data: HistLogEnumValues) => {
          // checking if call to the function return the expected  value
          expect(data).toBe(histLogEnumValues);
        });

    const expectedUrl = `${baseUrl}/api/historylogs/1/LogViewTable/enumvalues/${columnName}`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);
    const response = new HttpResponse({
      body: histLogEnumValues,
      headers: new HttpHeaders(),
      status: 200,
      statusText: 'OK',
      url: expectedUrl
    });
    expect(req.request.method).toEqual('GET');
    req.flush(histLogEnumValues);
    // checking if call to extract data is made with correct parameters during mock http call
    expect(extractDataSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http get response`);
    httpTestingController.verify();
  });

  it('should throw error for getHistoryLogEnumValues() call without systerm id', () => {
    const functionName = 'getHistoryLogEnumValues()';
    const columnName = 'RecordType';
    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
    handleErrorSpy.and.returnValue(throwError(new WsiError('The request is invalid', 400, 'BadRequest')));

    let errors = '';
    logViewerService.getHistoryLogEnumValues(undefined!, HistoryLogKind.LogView, columnName)
      .subscribe(
        result => {
          fail('expected that %s to fail: ');
        },
        (error: HttpErrorResponse) => {
          errors = error.message;
          expect(errors.includes('The request is invalid')).toBeTruthy();
        }
      );

    const expectedUrl = `${baseUrl}/api/historylogs/undefined/LogViewTable/enumvalues/${columnName}`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);

    req.error(new ErrorEvent('The request is invalid'), {
      status: 400,
      statusText: 'BadRequest'
    });

    const response = new HttpErrorResponse({
      error: new ErrorEvent('The request is invalid'),
      headers: new HttpHeaders(),
      status: 400,
      statusText: 'BadRequest',
      url: expectedUrl
    });
    expect(handleErrorSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http get response`, errorService);
    httpTestingController.verify();
  });

  it('Give error info for HistoryLogEnumValues() call  without columnName',
    () => {
      const errors = '';
      const functionName = 'getHistoryLogEnumValues()';
      const wsiEndpointService = TestBed.inject(WsiEndpointService);
      const baseUrl = 'https://test-server.com';
      spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
      const columnName = undefined;
      /* eslint-disable @typescript-eslint/naming-convention */
      const histLogEnumValues: HistLogEnumValues = {
        ErrorInfo: ['Invalid column name or column does not support enumeration values.']
      };
      /* eslint-disable @typescript-eslint/naming-convention */
      extractDataSpy.and.returnValue(histLogEnumValues);
      logViewerService.getHistoryLogEnumValues(1, HistoryLogKind.LogView, columnName!)
        .subscribe(
          (data: HistLogEnumValues) => {
            // checking if call to the function return the expected  value
            expect(data).toBe(histLogEnumValues);
          });
      const expectedUrl = `${baseUrl}/api/historylogs/1/LogViewTable/enumvalues/${columnName}`;
      const req: TestRequest = httpTestingController.expectOne(expectedUrl);
      const response = new HttpResponse({
        body: histLogEnumValues,
        headers: new HttpHeaders(),
        status: 200,
        statusText: 'OK',
        url: expectedUrl
      });
      expect(req.request.method).toEqual('GET');
      req.flush(histLogEnumValues);
      // checking if call to extract data is made with correct parameters during mock http call
      expect(extractDataSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http get response`);
      httpTestingController.verify();
    });

  // /////////////////////////////////////////////////////////////////////////////////////////////////////////

  // //////////////////////////////// getAccessRightsForLogViewer  test cases//////////////////////////////////////

  it('can retrieve getAccessRightsForLogViewer data', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const applicationRights: AppRights = {
      'ApplicationRights': [
        {
          'Name': 'BACnet Configuration',
          'Id': 6,
          'Operations': [
            {
              'Name': 'Show',
              'Id': 192
            },
            {
              'Name': 'Configure',
              'Id': 194
            }
          ]
        }]
    };
    /* eslint-disable @typescript-eslint/naming-convention */

    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);

    // to stub the call to extract data function now extractDataSpy mimics it
    extractDataSpy.and.returnValue(applicationRights);
    const functionName = 'getAccessRightsForLogViewer()';

    logViewerService.getAccessRightsForLogViewer()
      .subscribe(
        (data: AppRights) => {
          // checking if call to the function return the expected  value
          expect(data).toBe(applicationRights);
        });

    const expectedUrl = `${baseUrl}/api/accessrights`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);
    const response = new HttpResponse({
      body: applicationRights,
      headers: new HttpHeaders(),
      status: 200,
      statusText: 'OK',
      url: expectedUrl
    });
    expect(req.request.method).toEqual('GET');
    req.flush(applicationRights);
    // checking if call to extract data is made with correct parameters during mock http call
    expect(extractDataSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http get response`);
    httpTestingController.verify();
  });

  it('should throw error for getAccessRightsForLogViewer() call  without systerm id',
    () => {
      let errors = '';
      const functionName = 'getAccessRightsForLogViewer()';
      const columnName = 'RecordType';
      const wsiEndpointService = TestBed.inject(WsiEndpointService);
      const baseUrl = 'https://test-server.com';
      spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
      handleErrorSpy.and.returnValue(throwError(new WsiError('Authorization has been denied for this request.', 401, 'Unauthorized')));

      logViewerService.getAccessRightsForLogViewer()
        .subscribe(result => {
          fail('expected that %s to fail: ');
        },
        (error: HttpErrorResponse) => {
          errors = error.message;
          expect(errors.includes('Authorization has been denied for this request.')).toBeTruthy();
        }
        );
      const expectedUrl = `${baseUrl}/api/accessrights`;
      const req: TestRequest = httpTestingController.expectOne(expectedUrl);
      let headers: HttpHeaders = new HttpHeaders();
      headers = headers.append(
        'Accept',
        'text/html,application/json'
      );

      req.error(new ErrorEvent('Authorization has been denied for this request.'), {
        status: 401,
        statusText: 'Unauthorized'
      });
      const response = new HttpErrorResponse({
        error: new ErrorEvent('Authorization has been denied for this request.'),
        headers: new HttpHeaders(),
        status: 401,
        statusText: 'Unauthorized',
        url: expectedUrl
      });
      expect(handleErrorSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http get response`, errorService);
      httpTestingController.verify();
    });
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////

  // //////////////////////////////// discardSnapshot  test cases//////////////////////////////////////

  it('can retrieve discardSnapshot data',
    () => {
      /* eslint-disable @typescript-eslint/naming-convention */

      // to stub the call to extract data function now extractDataSpy mimics it
      extractDataSpy.and.returnValue(true);
      const wsiEndpointService = TestBed.inject(WsiEndpointService);
      const baseUrl = 'https://test-server.com';
      spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
      const functionName = 'discardSnapshot()';
      const snapshotId = encodeURIComponent(encodeURIComponent(encodeURIComponent(JSON.stringify('string'))));
      logViewerService.discardSnapshot(1, HistoryLogKind.ActivityFeed, 'string')
        .subscribe(
          (data: boolean) => {
            // checking if call to the function return the expected  value
            expect(data).toBe(true);
          });
      const expectedUrl = `${baseUrl}/api/historylogs/1/ActivityFeedTable/${snapshotId}`;
      const req: TestRequest = httpTestingController.expectOne(expectedUrl);
      const response = new HttpResponse({
        body: true,
        headers: new HttpHeaders(),
        status: 200,
        statusText: 'OK',
        url: expectedUrl
      });
      expect(req.request.method).toEqual('DELETE');
      req.flush(true);
      // checking if call to extract data is made with correct parameters during mock http call
      expect(extractDataSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http delete response`);
      httpTestingController.verify();
    });

  it('should throw error for discardSnapshot() call  without systerm id', () => {
    let errors = '';
    const functionName = 'discardSnapshot()';
    const snapshotId = encodeURIComponent(encodeURIComponent(encodeURIComponent(JSON.stringify('string'))));
    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
    handleErrorSpy.and.returnValue(throwError(new WsiError('Unauthorized error', 401, 'BadRequest')));
    logViewerService.discardSnapshot(undefined!, HistoryLogKind.ActivityFeed, 'string')
      .subscribe(result => {
        fail('expected that %s to fail: ');
      },
      (error: HttpErrorResponse) => {
        errors = error.message;
        expect(errors.includes('Unauthorized error')).toBeTruthy();
      }
      );
    const expectedUrl = `${baseUrl}/api/historylogs/undefined/ActivityFeedTable/${snapshotId}`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append(
      'Accept',
      'text/html,application/json'
    );

    req.error(new ErrorEvent('Unauthorized error'), {
      status: 401,
      statusText: 'BadRequest'
    });
    const response = new HttpErrorResponse({
      error: new ErrorEvent('Unauthorized error'),
      headers: new HttpHeaders(),
      status: 401,
      statusText: 'BadRequest',
      url: expectedUrl
    });
    expect(handleErrorSpy).toHaveBeenCalledOnceWith(response, TraceModules.historyLog, `${functionName}: http delete response`, errorService);
    httpTestingController.verify();
  });

  // /////////////////////////////////////////////////////////////////////////////////////////////////////////

  // //////////////////////////////// putSettings  test cases//////////////////////////////////////

  it('can retrieve putSettings data',
    () => {
      /* eslint-disable @typescript-eslint/naming-convention */

      // to stub the call to extract data function now extractDataSpy mimics it
      spyOn(logViewerService as any, 'extractUpdate').and.returnValue(true);
      const functionName = 'putSettings()';
      const wsiEndpointService = TestBed.inject(WsiEndpointService);
      const baseUrl = 'https://test-server.com';
      spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
      const settingsID = 'string';
      logViewerService.putSettings(settingsID, 'string')
        .subscribe(
          (data: boolean) => {
            // checking if call to the function return the expected  value
            expect(data).toBe(true);
          });
      const expectedUrl = `${baseUrl}/api/settings/${settingsID}`;
      const req: TestRequest = httpTestingController.expectOne(expectedUrl);
      const response = new HttpResponse({
        body: true,
        headers: new HttpHeaders(),
        status: 200,
        statusText: 'OK',
        url: expectedUrl
      });
      expect(req.request.method).toEqual('PUT');
      req.flush(true);
      // checking if call to extract data is made with correct parameters during mock http call
      expect((logViewerService as any).extractUpdate).toHaveBeenCalled();
      httpTestingController.verify();
    });

  it('should throw error for putSettings() call  without settings id', () => {
    let errors = '';
    const functionName = 'putSettings()';
    const wsiEndpointService = TestBed.inject(WsiEndpointService);
    const baseUrl = 'https://test-server.com';
    spyOnProperty(wsiEndpointService, 'entryPoint').and.returnValue(baseUrl);
    handleErrorSpy.and.returnValue(throwError(new WsiError('Unauthorized error', 401, 'BadRequest')));
    logViewerService.putSettings(undefined!, 'string')
      .subscribe(result => {
        fail('expected that %s to fail: ');
      },
      (error: HttpErrorResponse) => {
        errors = error.message;
        expect(errors.includes('Unauthorized error')).toBeTruthy();
      }
      );
    const expectedUrl = `${baseUrl}/api/settings/undefined`;
    const req: TestRequest = httpTestingController.expectOne(expectedUrl);
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append(
      'Accept',
      'text/html,application/json'
    );

    req.error(new ErrorEvent('Unauthorized error'), {
      status: 401,
      statusText: 'BadRequest'
    });
    const response = new HttpErrorResponse({
      error: new ErrorEvent('Unauthorized error'),
      headers: new HttpHeaders(),
      status: 401,
      statusText: 'BadRequest',
      url: expectedUrl
    });
    expect(handleErrorSpy).toHaveBeenCalledOnceWith(response, TraceModules.settings, `${functionName}`, errorService);
    httpTestingController.verify();
  });
});
