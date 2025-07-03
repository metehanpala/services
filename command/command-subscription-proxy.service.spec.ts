/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';

import { WsiUtilityService } from '../shared/wsi-utility.service';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { CommandSubscriptionProxyService } from './command-subscription-proxy.service';

describe('CommandSubscriptionProxyService', () => {
  let service: CommandSubscriptionProxyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CommandSubscriptionProxyService,
        { provide: TraceService, useValue: jasmine.createSpyObj('TraceService', ['info', 'debug', 'error', 'isDebugEnabled']) },
        { provide: WsiEndpointService, useValue: {} },
        { provide: AuthenticationServiceBase, useValue: { userToken: 'dummy-token' } },
        { provide: SignalRService, useValue: { getNorisHubConnectionStatus: () => ({ subscribe: () => { } }) } },
        { provide: WsiUtilityService, useValue: { httpPostDefaultHeader: () => ({}), handleError: () => { }, extractData: () => { } } },
        { provide: ErrorNotificationServiceBase, useValue: {} }
      ]
    });

    service = TestBed.inject(CommandSubscriptionProxyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have subscribeCommands method', () => {
    expect(typeof service.subscribeCommands).toBe('function');
  });

  it('should have unSubscribeCommands method', () => {
    expect(typeof service.unSubscribeCommands).toBe('function');
  });

  it('should have commandChangeNotification method', () => {
    expect(typeof service.commandChangeNotification).toBe('function');
  });

  it('should have notifyConnectionState method', () => {
    expect(typeof service.notifyConnectionState).toBe('function');
  });
});
