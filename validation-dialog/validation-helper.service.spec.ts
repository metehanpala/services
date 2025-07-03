import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  AuthenticationServiceBase,
  ErrorNotificationServiceBase,
  TraceModules,
  TraceService
} from '@gms-flex/services-common';
import { of, throwError } from 'rxjs';

import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { BrowserObject } from '../wsi-proxy-api';
import { ValidateOpResponse } from './validate-op.response';
import { ValidationCommandOpRepresentation } from './validation-command-op.representation';
import { ValidationCredentialRepresentation } from './validation-credential.representation';
import { ValidationEditOpRepresentation } from './validation-edit-op.representation';
import { ValidationHelperService } from './validation-helper.service';

describe('ValidationHelperService', () => {
  let service: ValidationHelperService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let traceServiceSpy: jasmine.SpyObj<TraceService>;
  let authServiceSpy: jasmine.SpyObj<AuthenticationServiceBase>;
  let wsiEndpointServiceSpy: jasmine.SpyObj<WsiEndpointService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorNotificationServiceBase>;
  let wsiUtilityServiceSpy: jasmine.SpyObj<WsiUtilityService>;

  beforeEach(() => {
    // Create spies for all dependencies
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post']);
    traceServiceSpy = jasmine.createSpyObj('TraceService', ['info']);
    authServiceSpy = jasmine.createSpyObj('AuthenticationServiceBase', ['getUserInfo']);
    wsiEndpointServiceSpy = jasmine.createSpyObj('WsiEndpointService', [], {
      entryPoint: 'http://test-endpoint'
    });
    errorServiceSpy = jasmine.createSpyObj('ErrorNotificationServiceBase', ['showError']);
    wsiUtilityServiceSpy = jasmine.createSpyObj('WsiUtilityService', [
      'httpGetDefaultHeader',
      'handleError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ValidationHelperService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: TraceService, useValue: traceServiceSpy },
        { provide: AuthenticationServiceBase, useValue: authServiceSpy },
        { provide: WsiEndpointService, useValue: wsiEndpointServiceSpy },
        { provide: ErrorNotificationServiceBase, useValue: errorServiceSpy },
        { provide: WsiUtilityService, useValue: wsiUtilityServiceSpy }
      ]
    });

    service = TestBed.inject(ValidationHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(traceServiceSpy.info).toHaveBeenCalledWith(
      TraceModules.utilities,
      'Validation Helper Service created.'
    );
  });

  describe('handleResponse', () => {
    it('should return response body when response is ok', () => {
      // Arrange
      const mockResponse = new HttpResponse({
        body: { data: 'test' },
        status: 200,
        statusText: 'OK'
      });

      // Act
      const result = service.handleResponse(mockResponse);

      // Assert
      expect(result).toEqual({ data: 'test' });
    });

    it('should return undefined when response is not ok', () => {
      // Arrange
      const mockResponse = new HttpResponse({
        body: { data: 'test' },
        status: 400,
        statusText: 'Bad Request'
      });

      // Act
      const result = service.handleResponse(mockResponse);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getCommandValidationOperation', () => {
    it('should make POST request with correct parameters', () => {
      // Arrange
      const mockHeaders = new HttpHeaders();

      const mockValidationCommand: ValidationCommandOpRepresentation = {
        propertyIds: ['prop1', 'prop2'],
        cmdGroup: 123456
      };

      const mockResponse: ValidateOpResponse = {
        CommentRule: 'test-rule',
        IncrVersion: true,
        IsFourEyesEnabled: true,
        Log: true,
        ReAuthentication: 'test-auth',
        PredefinedComments: []
      };

      const mockHttpResponse = new HttpResponse({
        body: mockResponse,
        status: 200
      });

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(mockHeaders);
      httpClientSpy.post.and.returnValue(of(mockHttpResponse));

      // Act
      service.getCommandValidationOperation(mockValidationCommand).subscribe(result => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(httpClientSpy.post).toHaveBeenCalledWith(
          'http://test-endpoint/api/validation/getCommandValidationOperation',
          mockValidationCommand,
          jasmine.any(Object)
        );
      });
    });

    it('should handle error response', () => {
      // Arrange
      const mockError = new HttpResponse({ status: 500 });
      const mockValidationCommand: ValidationCommandOpRepresentation = {
        propertyIds: [],
        cmdGroup: 1
      };

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(new HttpHeaders());
      httpClientSpy.post.and.returnValue(throwError(() => mockError));
      wsiUtilityServiceSpy.handleError.and.returnValue(throwError(() => 'Error'));

      // Act & Assert
      service.getCommandValidationOperation(mockValidationCommand).subscribe({
        error: error => {
          expect(error).toBe('Error');
          expect(wsiUtilityServiceSpy.handleError).toHaveBeenCalledWith(
            mockError,
            TraceModules.utilities,
            'getCommandValidationOperation()',
            errorServiceSpy
          );
        }
      });
    });
  });

  describe('getEditValidationOperation', () => {
    it('should make POST request with correct parameters', () => {
      // Arrange
      const mockHeaders = new HttpHeaders();
      const mockEditOp: ValidationEditOpRepresentation = {
        ObjectIds: ['obj1', 'obj2']
      };
      const mockResponse: ValidateOpResponse = {
        CommentRule: 'test-rule',
        IncrVersion: true,
        IsFourEyesEnabled: true,
        Log: true,
        ReAuthentication: 'test-auth',
        PredefinedComments: []
      };
      const mockHttpResponse = new HttpResponse({
        body: mockResponse,
        status: 200
      });

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(mockHeaders);
      httpClientSpy.post.and.returnValue(of(mockHttpResponse));

      // Act
      service.getEditValidationOperation(mockEditOp).subscribe(result => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(httpClientSpy.post).toHaveBeenCalledWith(
          'http://test-endpoint/api/validation/getEditValidationOperation',
          mockEditOp,
          jasmine.any(Object)
        );
      });
    });

    it('should handle error response', () => {
      // Arrange
      const mockError = new HttpResponse({ status: 500 });
      const mockEditOp: ValidationEditOpRepresentation = {
        ObjectIds: []
      };

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(new HttpHeaders());
      httpClientSpy.post.and.returnValue(throwError(() => mockError));
      wsiUtilityServiceSpy.handleError.and.returnValue(throwError(() => 'Error'));

      // Act & Assert
      service.getEditValidationOperation(mockEditOp).subscribe({
        error: error => {
          expect(error).toBe('Error');
          expect(wsiUtilityServiceSpy.handleError).toHaveBeenCalledWith(
            mockError,
            TraceModules.utilities,
            'getEditValidationOperation()',
            errorServiceSpy
          );
        }
      });
    });
  });

  const createMockBrowserObject = (objectId: string): BrowserObject => ({
    Attributes: {
      ObjectId: objectId,
      Alias: 'test-alias',
      DefaultProperty: 'test-prop',
      DisciplineDescriptor: 'test-desc',
      DisciplineId: 1,
      FunctionDefaultProperty: 'test-func-prop',
      FunctionName: 'test-func',
      ManagedType: 1,
      ManagedTypeName: 'test-managed-type',
      SubDisciplineDescriptor: 'test-sub-desc',
      SubDisciplineId: 1,
      SubTypeDescriptor: 'test-sub-type',
      SubTypeId: 1,
      TypeDescriptor: 'test-type-desc',
      TypeId: 1,
      ObjectModelName: 'test-model',
      CustomData: {},
      ValidationRules: {}
    },
    Descriptor: 'test-desc',
    Designation: 'test-des',
    HasChild: false,
    Name: 'test-name',
    Location: 'test-location',
    ObjectId: objectId,
    SystemId: 1,
    ViewId: 1,
    ViewType: 1,
    AdditionalInfo: {}
  });

  describe('getRequiresValidation', () => {
    it('should return true when validation is required', () => {
      // Arrange
      const mockBrowserObjects: BrowserObject[] = [
        createMockBrowserObject('test-id')
      ];
      const mockResponse = {
        CommentRule: 'MANDATORY',
        IsFourEyesEnabled: true,
        ReAuthentication: 'REENTERPW',
        PredefinedComments: []
      };
      const mockHttpResponse = new HttpResponse({
        body: mockResponse,
        status: 200
      });

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(new HttpHeaders());
      httpClientSpy.post.and.returnValue(of(mockHttpResponse));

      // Act & Assert
      service.getRequiresValidation(mockBrowserObjects).subscribe(result => {
        expect(result).toBe(true);
        expect(httpClientSpy.post).toHaveBeenCalledWith(
          'http://test-endpoint/api/validation/getEditValidationOperation',
          { ObjectIds: ['test-id'] },
          jasmine.any(Object)
        );
      });
    });

    it('should return false when validation is not required', () => {
      // Arrange
      const mockBrowserObjects: BrowserObject[] = [
        createMockBrowserObject('obj1')
      ];
      const mockResponse = {
        IsModalRequired: false,
        ValidationRules: []
      };
      const mockHttpResponse = new HttpResponse({
        body: mockResponse,
        status: 200
      });

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(new HttpHeaders());
      httpClientSpy.post.and.returnValue(of(mockHttpResponse));

      // Act & Assert
      service.getRequiresValidation(mockBrowserObjects).subscribe(result => {
        expect(result).toBe(false);
      });
    });

    it('should return false when response is null', () => {
      // Arrange
      const mockBrowserObjects: BrowserObject[] = [
        createMockBrowserObject('obj1')
      ];
      const mockHttpResponse = new HttpResponse({
        body: null,
        status: 200
      });

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(new HttpHeaders());
      httpClientSpy.post.and.returnValue(of(mockHttpResponse));

      // Act & Assert
      service.getRequiresValidation(mockBrowserObjects).subscribe(result => {
        expect(result).toBe(false);
      });
    });

    it('should handle error response', () => {
      // Arrange
      const mockBrowserObjects: BrowserObject[] = [
        createMockBrowserObject('obj1')
      ];
      const mockError = new HttpResponse({ status: 500 });

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(new HttpHeaders());
      httpClientSpy.post.and.returnValue(throwError(() => mockError));
      wsiUtilityServiceSpy.handleError.and.returnValue(throwError(() => 'Error'));

      // Act & Assert
      service.getRequiresValidation(mockBrowserObjects).subscribe({
        error: error => {
          expect(error).toBe('Error');
          expect(wsiUtilityServiceSpy.handleError).toHaveBeenCalledWith(
            mockError,
            TraceModules.utilities,
            'getEditValidationOperation()',
            errorServiceSpy
          );
        }
      });
    });
  });

  describe('validateCredential', () => {
    it('should make POST request with correct parameters', () => {
      // Arrange
      const mockHeaders = new HttpHeaders();
      const mockCredential: ValidationCredentialRepresentation = {
        Password: 'testPass',
        SuperName: 'testUser',
        CheckCredentials: 1,
        ObjectIds: ['obj1'],
        SessionKey: 'test-session'
      };
      const mockResponse = new HttpResponse({
        status: 200,
        body: { isValid: true }
      });

      wsiUtilityServiceSpy.httpGetDefaultHeader.and.returnValue(mockHeaders);
      httpClientSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.validateCredential(mockCredential).subscribe(result => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(httpClientSpy.post).toHaveBeenCalledWith(
          'http://test-endpoint/api/validation/validateCredential',
          mockCredential,
          jasmine.any(Object)
        );
      });
    });
  });
});
