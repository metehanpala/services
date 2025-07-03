import { HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { Command, CommandParameters, EnumerationItem, PropertyCommand } from '../wsi-proxy-api/command/data.model';
import { ReadCommandService } from './read-command.service';

/* eslint-disable @typescript-eslint/naming-convention */

const enumerationItems: EnumerationItem[] = [
  {
    Descriptor: 'Descriptor',
    Value: 1
  },
  {
    Descriptor: 'Descriptor',
    Value: 1
  }
];

const commandParameters: CommandParameters[] = [
  {
    DataType: 'DataType',
    DefaultValue: 'DefaultValue',
    Descriptor: 'Descriptor',
    EnumerationTexts: enumerationItems,
    Max: 'Max',
    Min: 'Min',
    Name: 'Name',
    Order: 1
  },
  {
    DataType: 'DataType',
    DefaultValue: 'DefaultValue',
    Descriptor: 'Descriptor',
    EnumerationTexts: enumerationItems,
    Max: 'Max',
    Min: 'Min',
    Name: 'Name',
    Order: 1
  }
];

const commands: Command[] = [
  {
    Descriptor: 'Descriptor',
    GroupNumber: 1,
    Parameters: commandParameters,
    PropertyId: 'PropertyId1',
    Id: 'Id1',
    IsDefault: false
  },
  {
    Descriptor: 'Descriptor',
    GroupNumber: 1,
    Parameters: commandParameters,
    PropertyId: 'PropertyId2',
    Id: 'Id2',
    IsDefault: false
  }
];

const propertyCommands: PropertyCommand[] = [
  {
    Commands: commands,
    PropertyId: 'PropertyId1',
    ErrorCode: 1,
    SubscriptionKey: 1
  },
  {
    Commands: commands,
    PropertyId: 'PropertyId2',
    ErrorCode: 1,
    SubscriptionKey: 2
  }
];

/* eslint-enable @typescript-eslint/naming-convention */

class RouterStub { }

describe('ReadCommandService', () => {
  let httpTestingController: HttpTestingController;
  let readCommandService: ReadCommandService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        ReadCommandService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    readCommandService = TestBed.inject(ReadCommandService);
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create ReadCommandService', () => {
    expect(readCommandService instanceof ReadCommandService).toBe(true);
  });

  // Test successful read of single property command
  it('should successfully read property command for single property', () => {
    const body: PropertyCommand = propertyCommands[0];

    readCommandService.readPropertyCommand('propertyId', 'CommandId', true, 'clientType')
      .subscribe(data => {
        expect(data).toEqual(body);
      });

    const request = httpTestingController.expectOne(
      data => data.method === 'GET' &&
        data.url === 'protocol://site:port/host/api/commands/propertyId'
    );

    expect(request.request.params.get('commandId')).toBe('CommandId');
    expect(request.request.params.get('enabledCommandsOnly')).toBe('true');
    expect(request.request.params.get('clientType')).toBe('clientType');

    request.flush(body);
  });

  // Test successful read of multiple property commands
  it('should successfully read property commands for multiple properties', () => {
    const body: PropertyCommand[] = propertyCommands;

    readCommandService.readPropertyCommands(['propertyId1', 'propertyId2'], 'CommandId', true, 'clientType')
      .subscribe(data => {
        expect(data).toEqual(body);
      });

    const request = httpTestingController.expectOne(
      data => data.method === 'POST' &&
        data.url === 'protocol://site:port/host/api/commands/'
    );

    expect(request.request.params.get('commandId')).toBe('CommandId');
    expect(request.request.params.get('enabledCommandsOnly')).toBe('true');
    expect(request.request.params.get('clientType')).toBe('clientType');
    expect(request.request.body).toBe(JSON.stringify(['propertyId1', 'propertyId2']));

    request.flush(body);
  });

  // Test error handling for invalid property ID
  it('should handle error when property ID is undefined', () => {
    readCommandService.readPropertyCommand(undefined as unknown as string)
      .subscribe({
        error: error => {
          expect(error.message).toBe('Invalid arguments!');
        }
      });
  });

  // Test error handling for invalid property IDs array
  it('should handle error when property IDs array is undefined', () => {
    readCommandService.readPropertyCommands(undefined as unknown as string[])
      .subscribe({
        error: error => {
          expect(error.message).toBe('Invalid arguments!');
        }
      });
  });

  // Test handleResponse method with valid data
  it('should properly validate parameter descriptors in handleResponse', () => {
    const response = new HttpResponse({
      body: propertyCommands,
      status: 200
    });

    const result = readCommandService.handleResponse(response);
    expect(result).toEqual(propertyCommands);
  });

  // Test optional parameters in readPropertyCommand
  it('should handle optional parameters in readPropertyCommand', () => {
    const body: PropertyCommand = propertyCommands[0];

    readCommandService.readPropertyCommand('propertyId')
      .subscribe(data => {
        expect(data).toEqual(body);
      });

    const request = httpTestingController.expectOne(
      data => data.method === 'GET' &&
        data.url === 'protocol://site:port/host/api/commands/propertyId'
    );

    expect(request.request.params.has('commandId')).toBeFalse();
    expect(request.request.params.has('clientType')).toBeFalse();
    expect(request.request.params.get('enabledCommandsOnly')).toBe('false');

    request.flush(body);
  });

  // Test HTTP error response
  it('should handle HTTP error responses', () => {
    readCommandService.readPropertyCommand('propertyId')
      .subscribe({
        error: error => {
          expect(error).toBeTruthy();
        }
      });

    const request = httpTestingController.expectOne(
      data => data.method === 'GET' &&
        data.url === 'protocol://site:port/host/api/commands/propertyId'
    );

    request.flush('Not Found', {
      status: 404,
      statusText: 'Not Found'
    });
  });

  // Test empty property IDs array
  it('should handle empty property IDs array', () => {
    readCommandService.readPropertyCommands([])
      .subscribe(data => {
        expect(data).toEqual([]);
      });

    const request = httpTestingController.expectOne(
      data => data.method === 'POST' &&
        data.url === 'protocol://site:port/host/api/commands/'
    );

    expect(request.request.body).toBe('[]');
    request.flush([]);
  });

  // Test malformed response data
  it('should handle malformed response data', () => {
    readCommandService.readPropertyCommand('propertyId')
      .subscribe({
        error: error => {
          expect(error).toBeTruthy();
        }
      });

    const request = httpTestingController.expectOne(
      data => data.method === 'GET' &&
        data.url === 'protocol://site:port/host/api/commands/propertyId'
    );

    request.flush({
      Id: 2400100,
      Error: 'Invalid Data',
      Details: 'Malformed response data'
    }, {
      status: 400,
      statusText: 'Bad Request'
    });
  });

  // Test different client types
  it('should handle different client types', () => {
    const clientTypes = ['All', 'Headless', 'Headful'];

    clientTypes.forEach(clientType => {
      readCommandService.readPropertyCommand('propertyId', undefined, false, clientType)
        .subscribe();

      const request = httpTestingController.expectOne(
        data => data.method === 'GET' &&
          data.url === 'protocol://site:port/host/api/commands/propertyId'
      );

      expect(request.request.params.get('clientType')).toBe(clientType);
      request.flush(propertyCommands[0]);
    });
  });

  // Test server errors
  it('should handle server errors', () => {
    const errorCodes = [500, 503, 504];

    errorCodes.forEach(errorCode => {
      readCommandService.readPropertyCommand('propertyId')
        .subscribe({
          error: error => {
            expect(error).toBeTruthy();
            expect(error.status).toBe(errorCode);
          }
        });

      const request = httpTestingController.expectOne(
        data => data.method === 'GET' &&
          data.url === 'protocol://site:port/host/api/commands/propertyId'
      );

      request.flush({
        Id: errorCode,
        Error: 'Server Error',
        Details: `Server error occurred with code ${errorCode}`
      }, {
        status: errorCode,
        statusText: 'Server Error'
      });
    });
  });

  // Test special characters in property IDs
  it('should handle special characters in property IDs', () => {
    const specialPropertyId = 'property/with?special&chars';
    const encodedPropertyId = encodeURIComponent(encodeURIComponent(specialPropertyId));

    readCommandService.readPropertyCommand(specialPropertyId)
      .subscribe(response => {
        // Add expectation here:
        expect(response).toEqual(propertyCommands[0]);
      });

    const request = httpTestingController.expectOne(
      data => data.method === 'GET' &&
        data.url === `protocol://site:port/host/api/commands/${encodedPropertyId}`
    );

    request.flush(propertyCommands[0]);
  });

  // Test booleansAsNumericText parameter
  it('should handle booleansAsNumericText parameter', () => {
    readCommandService.readPropertyCommands(['propertyId'], undefined, false, undefined, true)
      .subscribe();

    const request = httpTestingController.expectOne(
      data => data.method === 'POST' &&
        data.url === 'protocol://site:port/host/api/commands/'
    );

    expect(request.request.params.get('booleansAsNumericText')).toBe('true');
    request.flush(propertyCommands);
  });
});
