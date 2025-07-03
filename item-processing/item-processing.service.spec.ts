/* eslint-disable max-len */
import { TestBed } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { Subject } from 'rxjs';

import { DocumentServiceBase, FileUrl } from '../document';
import { BrowserObject, FilesServiceBase } from '../wsi-proxy-api';
import { PossibleActions } from './data.model';
import { ItemProcessingService } from './item-processing.service';

// Helper function to create a BrowserObject for testing
interface ObjectAttributes {
  ManagedType: number;
  Alias: string;
  DefaultProperty: string;
  DisciplineDescriptor: string;
  DisciplineId: number;
  FunctionName: string;
  ManagedTypeName: string;
  ObjectId: string;
  SubDisciplineDescriptor: string;
  SubDisciplineId: number;
  SubTypeDescriptor: string;
  SubTypeId: number;
  TypeId: number;
  ObjectModelName: string;
  Path: string;
  Type: string;
  TypeDescriptor: string;
  ParentId: string;
  Name: string;
}

const createBrowserObject = (managedType: number, designation = 'test-designation'): BrowserObject => {
  const attributes: ObjectAttributes = {
    ManagedType: managedType,
    Alias: '',
    DefaultProperty: '',
    DisciplineDescriptor: '',
    DisciplineId: 0,
    FunctionName: '',
    ManagedTypeName: '',
    ObjectId: '',
    SubDisciplineDescriptor: '',
    SubDisciplineId: 0,
    SubTypeDescriptor: '',
    SubTypeId: 0,
    TypeId: 0,
    ObjectModelName: '',
    Path: '',
    Type: '',
    TypeDescriptor: '',
    ParentId: '',
    Name: designation
  };

  return {
    Designation: designation,
    Descriptor: '',
    HasChild: false,
    Name: designation,
    Location: '',
    ObjectId: '',
    Path: '',
    SystemId: '',
    ViewId: '',
    ViewType: '',
    Attributes: attributes
  } as unknown as BrowserObject;
};

export class MockDocumentServiceBase {
  public isInWhitelist(path: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  public getFilePath(node: any): any {
    return {
      toPromise: () => Promise.resolve([{ Value: { Value: 'test-path' } }])
    };
  }

  public getUrl(message: any, designation: string): Promise<FileUrl> | undefined {
    return undefined;
  }
}

class MockFilesService extends FilesServiceBase {
  public stopRequest = new Subject<void>();

  public getDocument(designation: string): any {
    return this.getTestBlob();
  }

  public getFile(): any {
    return this.getTestBlob();
  }

  public getFileFromLink(): any {
    return this.getTestBlob();
  }

  private getTestBlob(): any {
    return {
      toPromise: () => Promise.resolve(new Blob(['test content']))
    };
  }
}

describe('ItemProcessingService', () => {
  let service: ItemProcessingService;
  let documentService: MockDocumentServiceBase;
  let filesService: MockFilesService;
  let mockAnchor: jasmine.SpyObj<HTMLAnchorElement>;
  let mockForm: jasmine.SpyObj<HTMLFormElement>;
  let mockInput: jasmine.SpyObj<HTMLInputElement>;
  let createElementSpy: jasmine.Spy;
  let documentAppendChildSpy: jasmine.Spy<(child: Node) => Node>;
  let documentRemoveChildSpy: jasmine.Spy<(child: Node) => Node>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: FilesServiceBase, useClass: MockFilesService },
        { provide: DocumentServiceBase, useClass: MockDocumentServiceBase },
        ItemProcessingService
      ]
    });

    service = TestBed.inject(ItemProcessingService);
    documentService = TestBed.inject(DocumentServiceBase) as MockDocumentServiceBase;
    filesService = TestBed.inject(FilesServiceBase) as MockFilesService;
  });

  it('should create Item Processing Service', () => {
    expect(service).toBeTruthy();
  });

  describe('getPossibleActions', () => {
    beforeEach(() => {
      spyOn(console, 'error').and.stub();
    });

    it('should return Default for unknown managed type', async () => {
      const node = createBrowserObject(999); // Unknown type
      const result = await service.getPossibleActions(node, '');
      expect(result).toBe(PossibleActions.Default);
    });

    // Helper function to create mock file path response
    const createMockFilePathResponse = (value: string): { toPromise: () => Promise<{ Value: { Value: string } }[]> } => ({
      toPromise: () => Promise.resolve([{ Value: { Value: value } }])
    });

    describe('EXTERNAL_DOCUMENT type', () => {
      let node: BrowserObject;
      let getFilePathSpy: jasmine.Spy;

      beforeEach(() => {
        node = createBrowserObject(78); // EXTERNAL_DOCUMENT type
        getFilePathSpy = spyOn(documentService, 'getFilePath');
        getFilePathSpy.and.returnValue(createMockFilePathResponse('http://example.com'));
      });

      it('should return CanOpenInNewTab when URL is in whitelist', async () => {
        spyOn(documentService, 'isInWhitelist').and.returnValue(Promise.resolve(true));
        const result = await service.getPossibleActions(node, '');
        expect(result).toBe(PossibleActions.CanOpenInNewTab);
      });

      it('should return OnlyOpenInNewTab when URL is not in whitelist', async () => {
        spyOn(documentService, 'isInWhitelist').and.returnValue(Promise.resolve(false));
        const result = await service.getPossibleActions(node, '');
        expect(result).toBe(PossibleActions.OnlyOpenInNewTab);
      });
    });

    describe('TRA_TECHOP type', () => {
      it('should always return OnlyOpenInNewTab', async () => {
        const node = createBrowserObject(90004); // TRA_TECHOP type
        const result = await service.getPossibleActions(node, '');
        expect(result).toBe(PossibleActions.OnlyOpenInNewTab);
      });
    });

    // Helper function to create error response
    const createMockErrorResponse = (error: Error): { toPromise: () => Promise<never> } => ({
      toPromise: () => Promise.reject(error)
    });

    it('should return CanOpenInNewTab for file:// protocol', async () => {
      const node = createBrowserObject(78); // EXTERNAL_DOCUMENT type
      spyOn(documentService, 'getFilePath').and.returnValue(
        createMockFilePathResponse('file://example.pdf')
      );

      const result = await service.getPossibleActions(node, '');
      expect(result).toBe(PossibleActions.CanOpenInNewTab);
    });

    it('should handle error in getFilePath', async () => {
      const node = createBrowserObject(78);
      const error = new Error('Error getting file path');
      spyOn(documentService, 'getFilePath').and.returnValue(
        createMockErrorResponse(error)
      );
      const traceService = (service as any).traceService;
      spyOn(traceService, 'error');

      const result = await service.getPossibleActions(node, '');
      expect(result).toBeUndefined();
      expect(traceService.error).toHaveBeenCalled();
    });

    // Helper function to create undefined response
    const createMockUndefinedResponse = (): { toPromise: () => Promise<undefined> } => ({
      toPromise: () => Promise.resolve(undefined)
    });

    // Helper function to create empty array response
    const createMockEmptyResponse = (): { toPromise: () => Promise<never[]> } => ({
      toPromise: () => Promise.resolve([])
    });

    it('should handle undefined response from getFilePath', async () => {
      const node = createBrowserObject(78);
      spyOn(documentService, 'getFilePath').and.returnValue(
        createMockUndefinedResponse()
      );

      const result = await service.getPossibleActions(node, '');
      expect(result).toBeUndefined();
    });

    it('should handle empty array response from getFilePath', async () => {
      const node = createBrowserObject(78);
      spyOn(documentService, 'getFilePath').and.returnValue(
        createMockEmptyResponse()
      );

      const result = await service.getPossibleActions(node, '');
      expect(result).toBeUndefined();
    });
  });

  describe('openInNewTab', () => {

    beforeEach(() => {
      mockAnchor = jasmine.createSpyObj('HTMLAnchorElement', ['click'], {
        href: '',
        target: ''
      });

      mockInput = jasmine.createSpyObj('HTMLInputElement', ['setAttribute']);
      Object.assign(mockInput, {
        type: 'hidden',
        name: 'pbfunc',
        value: 'testdata'
      });

      mockForm = jasmine.createSpyObj('HTMLFormElement', ['appendChild', 'submit', 'setAttribute'], {
        method: '',
        action: '',
        target: ''
      });

      createElementSpy = spyOn(document, 'createElement').and.callFake((tag: string) => {
        switch (tag) {
          case 'a': return mockAnchor;
          case 'form': return mockForm;
          case 'input': return mockInput;
          default: return document.createElement(tag);
        }
      });

      documentAppendChildSpy = spyOn(document.body, 'appendChild');
      documentRemoveChildSpy = spyOn(document.body, 'removeChild');
      spyOn(window, 'open');
    });

    it('should handle EXTERNAL_DOCUMENT with file protocol', async () => {
      const node = createBrowserObject(78);
      spyOn(filesService, 'getDocument').and.returnValue({
        toPromise: () => Promise.resolve(new Blob(['test content']))
      });

      service.openInNewTab(node, 'file://example.pdf');

      expect(filesService.getDocument).toHaveBeenCalledWith(node.Designation);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should handle EXTERNAL_DOCUMENT with http protocol', () => {
      const node = createBrowserObject(78);

      service.openInNewTab(node, 'http://example.com');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should handle TRA_TECHOP type with valid XML parameter and increment counter', () => {
      const node = createBrowserObject(90004);
      // XML structure must match exact node positions in service
      const parameter = '<?xml version="1.0"?><root><dummy/><dummy/><dummy/><data><dummy/><dummy/><dummy/><value>pbfunc=testdata</value></data><dummy/><url><dummy/><dummy/><dummy/><value>http://example.com</value></url></root>';

      service.openInNewTab(node, 'reference', parameter);

      expect(createElementSpy).toHaveBeenCalledWith('form');
      expect(mockForm.setAttribute).toHaveBeenCalledTimes(3);
      expect(mockForm.setAttribute).toHaveBeenCalledWith('method', 'post');
      expect(mockForm.setAttribute).toHaveBeenCalledWith('action', 'http://example.com');
      expect(mockForm.setAttribute).toHaveBeenCalledWith('target', 'TechOp1');
      expect(createElementSpy).toHaveBeenCalledWith('input');
      expect(mockInput.type).toBe('hidden');
      expect(mockInput.name).toBe('pbfunc');
      expect(mockInput.value).toBe('testdata');
      expect(mockForm.appendChild).toHaveBeenCalledWith(mockInput);
      expect(documentAppendChildSpy).toHaveBeenCalledWith(mockForm);
      expect(window.open).toHaveBeenCalledWith('post.htm', 'TechOp1');
      expect(mockForm.submit).toHaveBeenCalled();
      expect(documentRemoveChildSpy).toHaveBeenCalledWith(mockForm);
    });

    it('should increment counter for each TRA_TECHOP operation', () => {
      const node = createBrowserObject(90004);
      const parameter = '<?xml version="1.0"?><root><dummy/><dummy/><dummy/><data><dummy/><dummy/><dummy/><value>pbfunc=testdata</value></data><dummy/><url><dummy/><dummy/><dummy/><value>http://example.com</value></url></root>';

      // First call
      service.openInNewTab(node, 'reference', parameter);
      expect(mockForm.setAttribute).toHaveBeenCalledWith('target', 'TechOp1');

      // Second call
      service.openInNewTab(node, 'reference', parameter);
      expect(mockForm.setAttribute).toHaveBeenCalledWith('target', 'TechOp2');
    });

    it('should handle TRA_TECHOP type with empty nodes', () => {
      const node = createBrowserObject(90004);
      const parameter = '<?xml version="1.0"?><root><dummy/><dummy/><dummy/><data><dummy/><dummy/><dummy/><value></value></data><dummy/><url><dummy/><dummy/><dummy/><value></value></url></root>';

      service.openInNewTab(node, 'reference', parameter);

      expect(createElementSpy).not.toHaveBeenCalledWith('form');
    });

    it('should handle TRA_TECHOP type with missing required nodes', () => {
      const node = createBrowserObject(90004);
      // XML with correct structure but missing value nodes
      const parameter = '<?xml version="1.0"?><root><dummy/><dummy/><dummy/><data><dummy/><dummy/><dummy/><other/></data><dummy/><url><dummy/><dummy/><dummy/><other/></url></root>';

      service.openInNewTab(node, 'reference', parameter);

      expect(createElementSpy).not.toHaveBeenCalledWith('form');
    });

    it('should handle TRA_TECHOP type with missing pbfunc in XML', () => {
      const node = createBrowserObject(90004);
      const parameter = '<?xml version="1.0"?><root><dummy/><dummy/><dummy/><data><dummy/><dummy/><dummy/><other>invalid=data</other></data><dummy/><url><dummy/><dummy/><dummy/><value>http://example.com</value></url></root>';

      service.openInNewTab(node, 'reference', parameter);

      expect(createElementSpy).not.toHaveBeenCalledWith('form');
    });

    it('should handle EXTERNAL_DOCUMENT with file protocol and error', async () => {
      const node = createBrowserObject(78);
      spyOn(filesService, 'getDocument').and.returnValue({
        toPromise: () => Promise.reject(new Error('Error getting document'))
      });

      await service.openInNewTab(node, 'file://example.pdf');

      expect(filesService.getDocument).toHaveBeenCalledWith(node.Designation);
      // createElement is called but anchor is not clicked due to error
      expect(mockAnchor.click).not.toHaveBeenCalled();
    });
  });
});
