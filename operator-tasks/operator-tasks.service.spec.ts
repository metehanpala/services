import { HttpParams, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
  OperatorTaskInfo, OperatorTasksFilter, OperatorTaskStatus,
  OperatorTaskTemplatesResponse,
  SaveOperatorTaskData, TaskTemplateFilter
} from '../wsi-proxy-api/operator-tasks';
import { OperatorTasksService } from './operator-tasks.service';

class RouterStub { }
const filter: TaskTemplateFilter =
{
  SystemNumber: 1,
  TemplateCnsPath: '',
  TargetObjectModels: [],
  TargetDpIds: []
};

const filterOpTask: OperatorTasksFilter =
{
  IsEnabled: true,
  SystemId: 1,
  TasksId: [],
  TaskStatus: []
};
const saveOperatorTaskData: SaveOperatorTaskData =
{
  Id: 'Id',
  Status: 10,
  CreatedBy: 'CreatedBy',
  TaskDescriptionLocalized: 'TaskDescriptionLocalized',
  StartedBy: 'StartedBy',
  SystemId: 0,
  IsExpirationConfig: true,
  ExpirationTime: '2023-10-12T14:39:16.994Z',
  ExpirationTimeRun: '2023-10-12T14:39:16.994Z',
  DeferDuration: 0,
  DeferTime: '2023-10-12T14:39:16.994Z',
  DeferTimeRun: '2023-10-12T14:39:16.994Z',
  Deferred: true,
  PreviousStatus: 10,
  LastModificationTime: '2023-10-12T14:39:16.994Z',
  ValidationComment: 'ValidationComment',
  TargetDpIds: {},
  ValidRevertParameters: true,
  Removed: true,
  OperatorTaskNotesRepresentation: [
    {
      Date: '2023-10-12T14:39:16.994Z',
      User: 'User',
      Description: 'Description',
      ActionDetailsId: 1,
      ActionDetailsText: 'ActionDetailsText'
    }
  ],
  CnsPath: 'CnsPath',
  TemplateNameLocalized: 'TemplateNameLocalized',
  FileContent: 'FileContent',
  ScaledValues: true,
  TaskNameLocalized: 'TaskNameLocalized',
  Duration: 0,
  RevertActionMode: 0,
  TimeoutForConditions: 0,
  NotesRequired: 0,
  ObjectModelsAllowed: [
    'ObjectModelsAllowed'
  ],
  ObjectModelsNotAllowed: [
    'ObjectModelsNotAllowed'
  ],
  HasOverridableParameters: false
};

describe('OperatorTasksService', () => {
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
        OperatorTasksService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));
  it('should create OperatorTasksService',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {
      expect(operatorTasksService instanceof OperatorTasksService).toBe(true);
    }
    ));

  it('should call method getOperatorTaskTemplateList',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {

      operatorTasksService.getOperatorTaskTemplateList(filter)
        .subscribe(
          (data: OperatorTaskTemplatesResponse[]) => expect(data).toBeDefined(),
          error => error as any);
    }
    ));
  it('should call method getOperatorTasks',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {

      operatorTasksService.getOperatorTasks(filterOpTask)
        .subscribe(
          (data: OperatorTaskInfo[]) => expect(data).toBeDefined(),
          error => error as any);
    }
    ));
  it('should call method readOperatorTask',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {
      operatorTasksService.readOperatorTask('task1')
        .subscribe(
          (data: OperatorTaskInfo) => expect(data).toBeDefined(),
          error => error as any);
    }
    ));
  it('should call method saveOperatorTasks',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {
      operatorTasksService.saveOperatorTasks(saveOperatorTaskData)
        .subscribe(
          (data: any) => expect(data).toBeDefined(),
          error => error as any);
    }
    ));
  it('should call method checkTaskName',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {
      operatorTasksService.checkTaskName('taskName')
        .subscribe(
          (data: string) => expect(data).toBeDefined(),
          error => error as any);
    }
    ));
  it('should call method getTaskStatus',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {
      operatorTasksService.getTaskStatus()
        .subscribe(
          (data: OperatorTaskStatus[]) => expect(data).toBeDefined(),
          error => error as any);
    }
    ));
  it('should call method deleteOperatorTask',
    inject([OperatorTasksService], (operatorTasksService: OperatorTasksService) => {
      operatorTasksService.deleteOperatorTask('task1')
        .subscribe(
          (data: any) => expect(data).toBeDefined(),
          error => error as any);
    }
    ));
});
