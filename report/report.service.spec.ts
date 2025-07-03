/* eslint-disable @typescript-eslint/dot-notation */
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  AuthenticationServiceBase, ErrorNotificationServiceBase,
  MockTraceService, MockWsiEndpointService, TraceService
} from '@gms-flex/services-common';
import { of, throwError } from 'rxjs';

import { MockValueServiceBase } from '../document/document.service.spec';
import { MockFilesService } from '../files/mock-files.service';
import { FilesServiceBase, ValueDetails } from '../public-api';
import { ErrorNotificationService } from '../shared';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { ValueServiceBase } from '../values';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { CreateDocumentData, DocumentTypes, ReportContext, ReportDocumentData, ReportView } from '../wsi-proxy-api/report/data.model';
import { ReportService } from './report.service';

/* eslint-disable @typescript-eslint/naming-convention */
const tsds: ReportView = {
  ProductName: ''
};
/* eslint-enable @typescript-eslint/naming-convention */

class RouterStub { }

describe('ReportService', () => {
  let service: ReportService;
  let httpClient: HttpClient;

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
        ReportService,
        { provide: ValueServiceBase, useClass: MockValueServiceBase },
        { provide: FilesServiceBase, useClass: MockFilesService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  }));

  beforeEach(inject([ReportService, HttpClient], (reportService: ReportService, http: HttpClient) => {
    service = reportService;
    httpClient = http;
  }));

  it('should create ReportService',
    inject([ReportService], (reportService: ReportService) => {
      expect(reportService instanceof ReportService).toBe(true);
    })
  );

  /**
   * Tests for getWhitelist()
   * Verifies the service can fetch and handle whitelist configuration
   */
  describe('getWhitelist', () => {
    it('should return whitelist configuration when request succeeds', done => {
      const mockWhitelist = { whitelist: ['http://allowed.com'] };

      spyOn(httpClient, 'get').and.returnValue(of(mockWhitelist));

      service.getWhitelist().subscribe(result => {
        expect(result).toEqual(mockWhitelist);
        expect(httpClient.get).toHaveBeenCalledWith('./config/whitelist.settings.json');
        done();
      });
    });

    it('should return empty whitelist when request fails', done => {
      spyOn(httpClient, 'get').and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      service.getWhitelist().subscribe(result => {
        expect(result).toEqual({ whitelist: [] });
        done();
      });
    });
  });

  /**
   * Tests for isInWhitelist()
   * Verifies URL validation against whitelist
   */
  describe('isInWhitelist', () => {
    it('should return true for whitelisted URL', async () => {
      const mockWhitelist = { whitelist: ['http://allowed.com'] };
      spyOn(service, 'getWhitelist').and.returnValue(of(mockWhitelist));

      const result = await service.isInWhitelist('http://allowed.com');
      expect(result).toBe(true);
    });

    it('should return false for non-whitelisted URL', async () => {
      const mockWhitelist = { whitelist: ['http://allowed.com'] };
      spyOn(service, 'getWhitelist').and.returnValue(of(mockWhitelist));

      const result = await service.isInWhitelist('http://notallowed.com');
      expect(result).toBe(false);
    });
  });

  /**
   * Tests for getFilePath()
   * Verifies correct handling of property ID construction and value service interaction
   */
  describe('getFilePath', () => {
    it('should construct property ID correctly and call readValue', done => {
      const message = {
        ObjectId: 'obj123',
        Attributes: {
          DefaultProperty: 'prop456'
        }
      };
      const expectedPropertyId = 'obj123.prop456';
      const mockValueDetails: ValueDetails[] = [{
        DataType: 'string',
        ErrorCode: 0,
        SubscriptionKey: 1,
        Value: {
          Value: 'path/to/file',
          DisplayValue: '',
          Timestamp: '',
          QualityGood: false,
          Quality: ''
        },
        IsArray: false
      }];

      spyOn(service['valueService'], 'readValue').and.returnValue(of(mockValueDetails));

      service.getFilePath(message).subscribe(result => {
        expect(service['valueService'].readValue).toHaveBeenCalledWith(expectedPropertyId);
        expect(result).toEqual(mockValueDetails);
        done();
      });
    });
  });

  /**
   * Tests for openTab()
   * Verifies window.open is called with correct parameters
   */
  describe('openTab', () => {
    it('should open URL in new tab', () => {
      const testUrl = 'http://test.com';
      spyOn(window, 'open');

      service.openTab(testUrl);

      expect(window.open).toHaveBeenCalledWith(testUrl, '_blank');
    });
  });

  /**
   * Tests for getDocument()
   * Verifies document retrieval functionality with different scenarios
   */
  describe('getDocument', () => {
    it('should get document from files service when document data is provided', async () => {
      const systemId = 1;
      const documentData: ReportDocumentData = {
        DocumentPath: 'path/to/FlexReports/test.pdf',
        DocumentDisplayName: 'test.pdf',
        DocumentStatus: 'Complete',
        DocumentType: DocumentTypes.Pdf
      };
      const mockFileResponse = new Blob(['file-content'], { type: 'application/pdf' });

      spyOn(service['filesService'], 'getFile').and.returnValue(of(mockFileResponse));

      const result = await service.getDocument(systemId, documentData);

      expect(service['filesService'].getFile).toHaveBeenCalledWith(systemId, 'FlexReports/test.pdf');
      expect(result).toEqual({
        type: 'file',
        path: 'file://test.pdf',
        url: mockFileResponse
      });
    });

    it('should handle missing document data', async () => {
      const systemId = 1;
      const documentData = undefined as unknown as ReportDocumentData;

      const result = await service.getDocument(systemId, documentData);

      expect(result).toEqual({
        type: 'url',
        path: undefined,
        url: undefined
      });
    });

    it('should handle file service error', async () => {
      const systemId = 1;
      const documentData: ReportDocumentData = {
        DocumentPath: 'path/to/FlexReports/test.pdf',
        DocumentDisplayName: 'test.pdf',
        DocumentStatus: 'Complete',
        DocumentType: DocumentTypes.Pdf
      };

      spyOn(service['filesService'], 'getFile').and.returnValue(throwError(() => new Error('File not found')));

      const result = await service.getDocument(systemId, documentData);

      expect(result).toEqual({
        type: undefined,
        path: undefined,
        url: undefined
      });
    });
  });

  /**
   * Tests for getCreatedDocuments()
   * Verifies retrieval of created documents with success and error handling
   */
  describe('getCreatedDocuments', () => {
    it('should return created documents on success', done => {
      const createDocumentData: CreateDocumentData = {
        SystemId: 1,
        ReportExecutionParams: {
          ReportDefinitionId: 'report1',
          DocumentType: DocumentTypes.Pdf,
          ContextType: ReportContext.Single,
          NameFilter: ['filter1']
        }
      };
      const mockResponse: ReportDocumentData[] = [{
        DocumentPath: 'path/to/doc1',
        DocumentDisplayName: 'doc1',
        DocumentStatus: 'Complete',
        DocumentType: DocumentTypes.Pdf
      }, {
        DocumentPath: 'path/to/doc2',
        DocumentDisplayName: 'doc2',
        DocumentStatus: 'Complete',
        DocumentType: DocumentTypes.Pdf
      }];

      spyOn(service['httpClient'], 'get').and.returnValue(of({ body: mockResponse }));

      service.getCreatedDocuments(createDocumentData).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should handle error and call wsiUtilityService', done => {
      const createDocumentData: CreateDocumentData = {
        SystemId: 1,
        ReportExecutionParams: {
          ReportDefinitionId: 'report1',
          DocumentType: DocumentTypes.Pdf,
          ContextType: ReportContext.Single,
          NameFilter: ['filter1']
        }
      };
      const errorResponse = new HttpErrorResponse({ status: 500 });

      spyOn(service['httpClient'], 'get').and.returnValue(throwError(() => errorResponse));
      spyOn(service['wsiUtilityService'], 'handleError').and.returnValue(throwError(() => errorResponse));

      service.getCreatedDocuments(createDocumentData).subscribe({
        error: error => {
          expect(service['wsiUtilityService'].handleError).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  /**
   * Tests for getReportHistory()
   * Verifies retrieval of report history with success and error handling
   */
  describe('getReportHistory', () => {
    it('should return report history on success', done => {
      const systemId = 1;
      const reportId = '1';
      const mockResponse = [{
        DocumentPath: 'path/to/report1',
        DocumentDisplayName: 'report1',
        DocumentStatus: 'Complete',
        DocumentType: DocumentTypes.Pdf
      }];

      spyOn(service['httpClient'], 'get').and.returnValue(of({ body: mockResponse }));

      service.getReportHistory(systemId, reportId).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(service['httpClient'].get).toHaveBeenCalledWith(
          `protocol://site:port/host/api/historylogs/1/reports/history/${systemId}`,
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should handle error from getReportHistory', done => {
      const systemId = 1;
      const reportId = '1';
      const errorResponse = new HttpErrorResponse({ status: 500 });

      spyOn(service['httpClient'], 'get').and.returnValue(throwError(() => errorResponse));
      spyOn(service['wsiUtilityService'], 'handleError').and.returnValue(throwError(() => errorResponse));

      service.getReportHistory(systemId, reportId).subscribe({
        error: error => {
          expect(service['wsiUtilityService'].handleError).toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
