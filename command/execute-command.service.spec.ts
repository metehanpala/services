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
import {
  BulkCommandInput, BulkCommandInput2, BulkCommandResponse,
  CommandInput, CommandInput2, CommandResponse, CommentsInput
} from '../wsi-proxy-api/command/data.model';
import { ExecuteCommandService } from './execute-command.service';

class RouterStub {}
// Tests  /////////////
describe('ExecuteCommandService', () => {

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
        ExecuteCommandService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create ExecuteCommandService',
    inject([ExecuteCommandService], (executeCommandService: ExecuteCommandService) => {
      expect(executeCommandService instanceof ExecuteCommandService).toBe(true);
    }
    ));

  xit('check that executeCommand works ',
    inject([HttpTestingController, ExecuteCommandService], (httpTestingController: HttpTestingController, executeCommandService: ExecuteCommandService) => {

      const body: any = {};

      const status = 200;

      const statusText = 'OK';

      /* eslint-disable @typescript-eslint/naming-convention */
      const commandInput: CommandInput[] = [{
        Name: 'Name',
        DataType: 'DataType',
        Value: 'Value',
        Comments: { CommonText: 'comment1', MultiLangText: [] },
        Password: 'Password'
      }];
      /* eslint-enable @typescript-eslint/naming-convention */

      executeCommandService.executeCommand('propertyId', 'CommandId', commandInput).
        subscribe((data: void) => {
          expect(data).toEqual(body);
        });

      // Extecute-command service should have made one request to GET ExecuteCommand
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/commands/propertyId/CommandId');

      // Expect server to return the ExecuteCommand after GET
      const expectedResponse: HttpResponse<any> = new HttpResponse(
        { status: 200, statusText: 'OK', body });
      req.event(expectedResponse);

      req.flush(body);
      httpTestingController.verify();

    })
  );

  xit('check that ExecuteCommands works ',
    inject([HttpTestingController, ExecuteCommandService], (httpTestingController: HttpTestingController, executeCommandService: ExecuteCommandService) => {

      /* eslint-disable @typescript-eslint/naming-convention */

      const commandResponse: CommandResponse[] = [
        {
          PropertyId: 'PropertyId',
          ErrorCode: 1
        },
        {
          PropertyId: 'PropertyId2',
          ErrorCode: 1
        }
      ];

      const commandInputs: CommandInput[] = [
        {
          Name: 'Name',
          DataType: 'DataType',
          Value: 'Value',
          Comments: { CommonText: 'comment1', MultiLangText: [] },
          Password: 'Password'
        },
        {
          Name: 'Name',
          DataType: 'DataType',
          Value: 'Value',
          Comments: { CommonText: 'comment1', MultiLangText: [] },
          Password: 'Password'
        }
      ];

      const bulkCommandInput: BulkCommandInput = {
        CommandInputForExecution: commandInputs,
        PropertyIds: ['PropertyIds1', 'PropertyIds2']
      };

      const bulkCommandResponse: BulkCommandResponse = {
        Responses: commandResponse
      };

      /* eslint-enable @typescript-eslint/naming-convention */

      executeCommandService.executeCommands('CommandId', bulkCommandInput).
        subscribe((data: BulkCommandResponse) => {
          expect(data).toEqual(bulkCommandResponse);
        });

      // executeCommandService should have made one request to GET ExecuteCommand
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/commands/CommandId');

      // Expect server to return the ExecuteCommand after GET
      const expectedResponse: HttpResponse<any> = new HttpResponse(
        { status: 200, statusText: 'OK', body: bulkCommandResponse });
      req.event(expectedResponse);

      req.flush(bulkCommandResponse);
      httpTestingController.verify();

    })
  );

  it('check that ExecuteCommands2 works ',
    inject([HttpTestingController, ExecuteCommandService], (httpTestingController: HttpTestingController, executeCommandService: ExecuteCommandService) => {

      /* eslint-disable @typescript-eslint/naming-convention */

      const commandResponse2: CommandResponse[] = [
        {
          PropertyId: 'PropertyId',
          ErrorCode: 1
        },
        {
          PropertyId: 'PropertyId2',
          ErrorCode: 1
        }
      ];

      const commandInputs2: CommandInput2[] = [
        {
          Name: 'Name',
          DataType: 'DataType',
          Value: 'Value'
        },
        {
          Name: 'Name',
          DataType: 'DataType',
          Value: 'Value'
        }
      ];

      const commentsInput: CommentsInput = {
        CommonText: 'CommonText',
        MultiLangText: ['comment1', 'comment2']
      };

      const bulkCommandInput2: BulkCommandInput2 = {
        CommandInputForExecution: commandInputs2,
        PropertyIds: ['PropertyIds1', 'PropertyIds2'],
        Comments: commentsInput,
        Password: 'Password',
        SuperName: 'SuperName',
        SuperPassword: 'SuperPassword'
      };

      const bulkCommandResponse2: BulkCommandResponse = {
        Responses: commandResponse2
      };

      /* eslint-enable @typescript-eslint/naming-convention */

      executeCommandService.executeCommands2('CommandId', bulkCommandInput2).
        subscribe((data: BulkCommandResponse) => {
          expect(data).toEqual(bulkCommandResponse2);
        });

      // executeCommandService should have made one request to GET ExecuteCommand
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/commands/validateproperty/CommandId');

      // Expect server to return the ExecuteCommand after GET
      const expectedResponse: HttpResponse<any> = new HttpResponse(
        { status: 200, statusText: 'OK', body: bulkCommandResponse2 });
      req.event(expectedResponse);

      req.flush(bulkCommandResponse2);
      httpTestingController.verify();

    })
  );
});
