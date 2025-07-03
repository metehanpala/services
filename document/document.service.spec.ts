/* eslint-disable */
import { inject, TestBed, tick, waitForAsync } from '@angular/core/testing';

import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable, of, throwError } from 'rxjs';
import { ValueServiceBase } from '../values/value.service.base';
import { MockFilesService } from '../files/mock-files.service';
import { FilesServiceBase, ValueDetails } from '../wsi-proxy-api';
import { DocumentService } from './document.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export class MockValueServiceBase {
  public readValue(propertyId: string): Observable<ValueDetails[] | undefined> {
    const value: ValueDetails[] = [{
      DataType: "BasicString",
      Value: {
        Value: "file://ansi.html",
        DisplayValue: "file://ansi.html",
        Quality: "9439544818968559873",
        QualityGood: true,
        Timestamp: "2021-09-15T13:12:52.978Z"
      },
      ErrorCode: 0,
      SubscriptionKey: 0,
      IsArray: false
    }];

    if (propertyId === "System1:ApplicationView_Documents_ansi+.Reference"){
      return of(value);
    } else {
      return of(undefined);
    }
  }
}

export class MockFilesServiceBase {
  public getDocument(designation: string): Promise<Blob> | any  {
    if (designation === 'error') {
      throwError('Error');
    } else {
      return undefined;
    }
  }
}

// Tests  /////////////
describe('Document Service', () => {
  let spy: any;

  const message: any = {
    HasChild: true,
    ViewId: 10,
    ViewType: 1,
    Attributes: {
      DefaultProperty: "Reference",
      ObjectId: "System1:ApplicationView_Documents_ansi+",
      DisciplineDescriptor: "Management System",
      DisciplineId: 0,
      SubDisciplineDescriptor: "Applications",
      SubDisciplineId: 1,
      TypeDescriptor: "Document",
      TypeId: 2600,
      SubTypeDescriptor: "File",
      SubTypeId: 2601,
      ManagedType: 78,
      ManagedTypeName: "External Document",
      ObjectModelName: "GmsExternalDocument",
      ValidationRules: {
        CommentRule: "Optional",
        ReAuthentication: "NoNeed",
        Configuration: 0,
        IsFourEyesEnabled: false,
        _links: []
      }
    },
    Location: "System1.Application View:Applications.Documents.ansi+",
    SystemId: 1,
    Name: "ansi+",
    Descriptor: "ansi+",
    Designation: "System1.ApplicationView:ApplicationView.Documents.ansi+",
    ObjectId: "System1:ApplicationView_Documents_ansi+",
    _links: []
  };

  const valueFile: ValueDetails[] = [{
    DataType: "BasicString",
    Value: {
      Value: "file://ansi.html",
      DisplayValue: "file://ansi.html",
      Quality: "9439544818968559873",
      QualityGood: true,
      Timestamp: "2021-09-15T13:12:52.978Z"
    },
    ErrorCode: 0,
    SubscriptionKey: 0,
    IsArray: false
  }];

  const valueUrl: ValueDetails[] = [{
    DataType: "BasicString",
    Value: {
      Value: "http://www.google.com",
      DisplayValue: "http://www.google.com",
      Quality: "9439544818968559873",
      QualityGood: true,
      Timestamp: "2021-09-15T13:12:52.978Z"
    },
    ErrorCode: 0,
    SubscriptionKey: 0,
    IsArray: false
  }];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: ValueServiceBase, useClass: MockValueServiceBase },
        { provide: FilesServiceBase, useClass: MockFilesService },
        DocumentService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
      .compileComponents();
  }));

  it('should create Document Service',
    inject([DocumentService], (documentService: DocumentService) => {
      expect(documentService instanceof DocumentService).toBe(true);
  }));

  it('should get file path',
    inject([DocumentService], (DocumentService: DocumentService) => {
      DocumentService.getFilePath(message).subscribe(res => {
        expect(res).toEqual(valueFile);
      });
  }));

  it('should get whitelist',
    inject([DocumentService, HttpTestingController], (documentService: DocumentService, httpTestingController: HttpTestingController) => {
      const mockWhitelist = { whitelist: ['http://www.google.it', 'http://www.bing.com'] };
      documentService.getWhitelist().subscribe(res => {
        expect(res).toEqual(mockWhitelist);
      });

      const req = httpTestingController.expectOne('./config/whitelist.settings.json');
      expect(req.request.method).toEqual('GET');

      req.flush(mockWhitelist);
  }));

  it('should fail to get whitelist',
    inject([DocumentService, HttpTestingController], (documentService: DocumentService, httpTestingController: HttpTestingController) => {
      const mockWhitelist = { whitelist: ['http://www.google.it', 'http://www.bing.com'] };
      const mockError = { status: 404, statusText: 'File not found' };

      documentService.getWhitelist().subscribe(res => {
        expect(res).toEqual({ whitelist: [] });
      });

      const req = httpTestingController.expectOne('./config/whitelist.settings.json');
      expect(req.request.method).toEqual('GET');

      req.flush(mockWhitelist, mockError);
  }));

  it('should check if url is in whitelist',
    inject([DocumentService], (documentService: DocumentService) => {
      spy = spyOn(documentService, 'getWhitelist').and.returnValue(of({ whitelist: ['https://www.google.it', 'https://www.bing.com'] }));

      documentService.isInWhitelist('https://www.google.it').then(res => {
        expect(res).toBeTrue();
      });

      documentService.isInWhitelist('https://www.youtube.com').then(res => {
        expect(res).toBeFalse();
      });
  }));

  it('should get file',
    inject([DocumentService], (documentService: DocumentService) => {
      spy = spyOn(documentService, 'getFilePath').and.returnValue(of(valueFile));
      documentService.getUrl(message, message.Designation).then(res => {
        expect(res).toBeDefined;
        expect(res.type).toEqual('file');
      });
  }));

  it('should get url',
    inject([DocumentService], (documentService: DocumentService) => {
      spy = spyOn(documentService, 'getFilePath').and.returnValue(of(valueUrl));
      documentService.getUrl(message, message.Designation).then(res => {
        expect(res).toBeDefined;
        expect(res.type).toEqual('url');
      });
  }));

  it('should return undefined if an error is thrown while getting a file',
    inject([DocumentService], (documentService: DocumentService) => {
      spy = spyOn(documentService, 'getFilePath').and.returnValue(of(valueFile));
      documentService.getUrl(message, 'error').then(res => {
        expect(res).toBeDefined;
        expect(res.type).toEqual(undefined);
      });
  }));
});
