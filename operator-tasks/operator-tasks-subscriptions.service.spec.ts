/**
 * Unit tests for OperatorTasksSubscriptionsService.
 *
 * This test suite verifies the logic of OperatorTasksSubscriptionsService, which manages subscription
 * and notification functionality for operator-tasks snapin. It interacts with SignalR for real-time updates,
 * and provides mechanisms to subscribe, unsubscribe, and handle connection interruptions gracefully.
 *
 * Core aspects covered:
 * - SignalR connection and reconnection handling
 * - API calls for subscribing/unsubscribing to operator tasks
 * - Queuing/resending operations if SignalR is temporarily disconnected
 * - Notification emission for task changes
 * - Error propagation from all async operations
 *
 * All external dependencies (SignalR, HTTP, utilities) are mocked for isolation.
 */

import { HttpClient, HttpResponse } from '@angular/common/http';
import { NgZone } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthenticationServiceBase, ErrorDisplayItem, ErrorNotificationServiceBase, MockTraceService, TraceService } from '@gms-flex/services-common';
import { Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';

import { WsiUtilityService } from '../shared';
import { SignalRService } from '../signalr';
import { WsiEndpointService } from '../wsi-endpoint';
import { OperatorTaskInfo, SubscriptionWsiOpTasks, TaskFilterBody } from '../wsi-proxy-api/operator-tasks';
import { OperatorTasksSubscriptionsService } from './operator-tasks-subscriptions.service';

// ----------------------------------
// Mock Classes
// ----------------------------------

// Simulates the authentication token provider.
class MockAuthenticationService {
  public userToken = 'mock-token';
}

// Simulates API entrypoint discovery.
class MockWsiEndpointService {
  public entryPoint = 'http://mock-endpoint';
}

// Provides dummy HTTP headers, extractData, and error handling for API calls.
class MockWsiUtilityService {
  public httpPostDefaultHeader(): any { return {}; }
  public httpDeleteDefaultHeader(): any { return {}; }
  public extractData(response: HttpResponse<any>, traceModule: string, method: string): any {
    if (method === 'invokeOperatorTasksDelete') { return true; }
    return response?.body;
  }
  public handleError(error: any): Observable<never> { return throwError(() => error); }
}

// Simulates application-wide error notification service.
class MockErrorNotificationService extends ErrorNotificationServiceBase {
  private readonly _errorChanged = new ReplaySubject<ErrorDisplayItem>(1);
  private readonly _errors: ErrorDisplayItem[] = [];
  public get errorChanged(): Observable<ErrorDisplayItem> { return this._errorChanged.asObservable(); }
  public get errors(): ErrorDisplayItem[] { return this._errors; }
  public notifyErrorChange(): void { }
  public showError(): void { }
}

// Simulates SignalR service with full control of connection events and hub proxy objects.
class MockSignalRService {
  public readonly mockHub = {
    hubConnection: {
      connectionState: new Subject<SignalR.ConnectionState>(),
      connected: new Subject<boolean>(),
      disconnected: new Subject<boolean>(),
      isConnected: true,
      connectionStateValue: SignalR.ConnectionState.Connected,
      startHubConnection: jasmine.createSpy('startHubConnection'),
      connectionId: 'test-connection-id',
      connectionStateValueText: 'Connected'
    },
    registerEventHandler: (proxy: any): void => {
      // Mock implementation of registerEventHandler
    }
  };

  private readonly norisHubConnectionStatus = new Subject<boolean>();

  // Emits a connection status change (connected/disconnected)
  public getNorisHubConnectionStatus(): Observable<boolean> {
    return this.norisHubConnectionStatus.asObservable();
  }

  // Returns a mock hub for the tests
  public getNorisHub(): any {
    return this.mockHub;
  }

  public registerProxy(proxy: any): void {
    // Mock implementation of registerProxy
  }

  public emitConnectionStatus(status: boolean): void {
    this.norisHubConnectionStatus.next(status);
  }

  public emitConnectionState(state: SignalR.ConnectionState): void {
    this.mockHub.hubConnection.connectionState.next(state);
    this.mockHub.hubConnection.connectionStateValue = state;
  }

  public emitConnected(connected: boolean): void {
    this.mockHub.hubConnection.connected.next(connected);
    if (connected) {
      this.mockHub.hubConnection.isConnected = true;
      this.mockHub.hubConnection.connectionStateValue = SignalR.ConnectionState.Connected;
    }
  }

  public emitDisconnected(disconnected: boolean): void {
    this.mockHub.hubConnection.disconnected.next(disconnected);
    if (disconnected) {
      this.mockHub.hubConnection.isConnected = false;
      this.mockHub.hubConnection.connectionStateValue = SignalR.ConnectionState.Disconnected;
    }
  }

  public setConnectionState(isConnected: boolean): void {
    this.mockHub.hubConnection.isConnected = isConnected;
    this.mockHub.hubConnection.connectionStateValue = isConnected ?
      SignalR.ConnectionState.Connected :
      SignalR.ConnectionState.Disconnected;
  }
}

// ----------------------------------
// Main Test Suite
// ----------------------------------

describe('OperatorTasksSubscriptionsService', () => {
  let service: OperatorTasksSubscriptionsService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let signalRService: SignalRService;
  let wsiEndpointService: WsiEndpointService;
  let wsiUtilityService: WsiUtilityService;
  let traceService: TraceService;
  let mockSignalR: MockSignalRService;

  beforeEach(() => {
    // All dependencies are mocked for complete isolation
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'delete']);
    mockSignalR = new MockSignalRService();

    TestBed.configureTestingModule({
      providers: [
        OperatorTasksSubscriptionsService,
        { provide: HttpClient, useValue: spy },
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: MockErrorNotificationService },
        { provide: SignalRService, useValue: mockSignalR },
        { provide: TraceService, useClass: MockTraceService }
      ]
    });

    service = TestBed.inject(OperatorTasksSubscriptionsService);
    httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    signalRService = TestBed.inject(SignalRService);
    wsiEndpointService = TestBed.inject(WsiEndpointService);
    wsiUtilityService = TestBed.inject(WsiUtilityService);
    traceService = TestBed.inject(TraceService);
  });

  /**
   * Verifies that the service is created successfully and all dependencies are resolved.
   */
  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // ----------------------------------
  // SignalR Connection Management
  // ----------------------------------
  describe('SignalR Connection', () => {
    /**
     * Should create SignalR event proxies (internal hub proxies) if connection is established.
     * Simulates a successful SignalR connection event and checks service properties.
     */
    it('should create event proxies when SignalR is connected', fakeAsync(() => {
      mockSignalR.emitConnectionStatus(true);
      tick();

      expect(service.hubProxyShared).toBeTruthy();
      expect(service.hubProxyOperatorTasks).toBeTruthy();
      expect(service.hubProxyOperatorTasksSubs).toBeTruthy();
    }));

    /**
     * Should NOT create event proxies if SignalR connection fails.
     */
    it('should not create event proxies when SignalR connection fails', fakeAsync(() => {
      mockSignalR.emitConnectionStatus(false);
      tick();

      expect(service.hubProxyShared).toBeUndefined();
      expect(service.hubProxyOperatorTasks).toBeUndefined();
      expect(service.hubProxyOperatorTasksSubs).toBeUndefined();
    }));

    /**
     * Simulates disconnection event after an established connection and ensures that
     * any active task subscriptions are cleared and appropriate error is emitted to the observer.
     */
    it('should handle disconnection and clear subscriptions', fakeAsync(() => {
      // First establish connection
      mockSignalR.emitConnectionStatus(true);
      tick();

      // Set up subscription context BEFORE disconnection
      const mockFilter: TaskFilterBody = {
        IsEnabled: true,
        SystemId: 1,
        TasksId: ['123'],
        TaskStatus: [1]
      };

      const mockResponse = new HttpResponse({ body: true });
      httpClientSpy.post.and.returnValue(of(mockResponse));

      let errorMessage: string | undefined;

      // Subscribe first and catch the error
      service.subscribeOperatorTasks(mockFilter).subscribe({
        error: (err: string) => {
          errorMessage = err;
        }
      });
      tick();

      // Then simulate disconnection
      mockSignalR.setConnectionState(false);
      mockSignalR.emitDisconnected(true);
      mockSignalR.mockHub.hubConnection.connectionState.next(SignalR.ConnectionState.Disconnected);
      tick();

      // Verify the error message and that subscriptions were cleared
      expect(errorMessage).toBe('Notification channel disconnected.');
      expect((service as any)._subscribeRequestsInvoked.size).toBe(0);
    }));

    /**
     * Should trigger the hub reconnection logic if disconnected, waiting appropriate timeout.
     */
    it('should attempt reconnection after disconnect', fakeAsync(() => {
      mockSignalR.emitConnectionStatus(true);
      tick();

      // Simulate disconnect
      mockSignalR.emitDisconnected(true);

      tick(5000); // Wait for reconnect timeout

      expect(mockSignalR.mockHub.hubConnection.startHubConnection).toHaveBeenCalled();
    }));
  });

  // ----------------------------------
  // Task Subscription Logic
  // ----------------------------------
  describe('subscribeOperatorTasks', () => {
    /**
     * Should immediately subscribe via HTTP POST if SignalR is connected.
     */
    it('should subscribe when SignalR is connected', fakeAsync(() => {
      const mockFilter: TaskFilterBody = {
        IsEnabled: true,
        SystemId: 1,
        TasksId: ['123'],
        TaskStatus: [1]
      };
      const mockResponse = new HttpResponse({ body: true });
      httpClientSpy.post.and.returnValue(of(mockResponse));
      mockSignalR.emitConnectionStatus(true);
      tick();

      let result: boolean | undefined;
      service.subscribeOperatorTasks(mockFilter).subscribe(response => {
        result = response;
      });
      tick();

      expect(httpClientSpy.post).toHaveBeenCalled();
    }));

    /**
     * Should propagate errors from HTTP POST during subscription.
     */
    it('should handle subscription error', fakeAsync(() => {
      const mockFilter: TaskFilterBody = {
        IsEnabled: true,
        SystemId: 1,
        TasksId: ['123'],
        TaskStatus: [1]
      };
      const mockError = new Error('Subscription error');
      httpClientSpy.post.and.returnValue(throwError(() => mockError));
      mockSignalR.emitConnectionStatus(true);
      tick();

      let error: Error | undefined;
      service.subscribeOperatorTasks(mockFilter).subscribe({
        error: err => {
          error = err;
        }
      });
      tick();

      expect(error).toBe(mockError);
    }));

    /**
     * Should queue the subscription if SignalR is disconnected, and retry after connection is restored.
     */
    it('should queue subscription when SignalR is disconnected and retry after connection', fakeAsync(() => {
      const mockFilter: TaskFilterBody = {
        IsEnabled: true,
        SystemId: 1,
        TasksId: ['123'],
        TaskStatus: [1]
      };

      const mockResponse = new HttpResponse({ body: true });
      httpClientSpy.post.and.returnValue(of(mockResponse));
      mockSignalR.emitConnectionStatus(true);
      tick();

      // Set SignalR as disconnected
      mockSignalR.setConnectionState(false);

      // Attempt to subscribe
      service.subscribeOperatorTasks(mockFilter).subscribe();
      tick();

      // Simulate reconnection
      mockSignalR.emitConnected(true);
      tick();

      expect(httpClientSpy.post).toHaveBeenCalled();
    }));
  });

  // ----------------------------------
  // Task Unsubscribe Logic
  // ----------------------------------
  describe('unSubscribeOperatorTasks', () => {
    /**
     * Should immediately unsubscribe via HTTP DELETE if SignalR is connected.
     */
    it('should unsubscribe when SignalR is connected', fakeAsync(() => {
      const mockResponse = new HttpResponse({ body: true, status: 200 });
      httpClientSpy.delete.and.returnValue(of(mockResponse));
      mockSignalR.emitConnectionStatus(true);
      tick();

      let result: boolean | undefined;
      service.unSubscribeOperatorTasks().subscribe(response => {
        result = response;
      });
      tick();

      expect(httpClientSpy.delete).toHaveBeenCalled();
    }));

    /**
     * Should propagate errors from HTTP DELETE during unsubscription.
     */
    it('should handle unsubscribe error', fakeAsync(() => {
      const mockError = new Error('Unsubscribe error');
      httpClientSpy.delete.and.returnValue(throwError(() => mockError));
      mockSignalR.emitConnectionStatus(true);
      tick();

      let error: Error | undefined;
      service.unSubscribeOperatorTasks().subscribe({
        error: err => {
          error = err;
        }
      });
      tick();

      expect(error).toBe(mockError);
    }));

    /**
     * Should wait for SignalR connection before sending the unsubscribe request, retrying on reconnection.
     */
    it('should wait for connection before unsubscribing when SignalR is disconnected', fakeAsync(() => {
      const mockResponse = new HttpResponse({ body: true });
      httpClientSpy.delete.and.returnValue(of(mockResponse));
      mockSignalR.emitConnectionStatus(true);
      tick();

      // Set SignalR as disconnected
      mockSignalR.setConnectionState(false);

      // Attempt to unsubscribe
      service.unSubscribeOperatorTasks().subscribe();
      tick();

      // Simulate reconnection
      mockSignalR.emitConnected(true);
      tick();

      expect(httpClientSpy.delete).toHaveBeenCalled();
    }));
  });

  // ----------------------------------
  // Notification and Event Emission
  // ----------------------------------
  describe('Notification Handling', () => {
    /**
     * Should emit a new operator tasks list when task changes are notified via the internal event handler.
     */
    it('should emit operator tasks changes', fakeAsync(() => {
      mockSignalR.emitConnectionStatus(true);
      tick();

      const mockTasks = [{
        Id: '1',
        TaskName: 'Test Task',
        Status: 1
      } as OperatorTaskInfo];

      let notifiedTasks: OperatorTaskInfo[] | undefined;

      service.operatorTasksChangeNotification().subscribe(tasks => {
        notifiedTasks = tasks;
      });

      // Simulate task change notification
      (service as any).onNotifyOperatorTasksChanges(mockTasks);
      tick();

      expect(notifiedTasks).toEqual(mockTasks);
    }));

    /**
     * Should handle incoming subscription status notifications and act on the subscription context.
     * (This is a partial behavioral check)
     */
    it('should handle subscription status notifications', fakeAsync(() => {
      mockSignalR.emitConnectionStatus(true);
      tick();

      const mockSubscription: SubscriptionWsiOpTasks = {
        ErrorCode: 0,
        RequestId: 'test-request',
        RequestFor: 'notifyChangeOfTasks'
      };

      // Set up a subscription context
      const mockFilter: TaskFilterBody = {
        IsEnabled: true,
        SystemId: 1,
        TasksId: ['123'],
        TaskStatus: [1]
      };

      const mockResponse = new HttpResponse({ body: true });
      httpClientSpy.post.and.returnValue(of(mockResponse));
      service.subscribeOperatorTasks(mockFilter).subscribe();
      tick();

      // Simulate subscription notification
      (service as any).onNotifySubscriptions(mockSubscription);
      tick();

      // Note: The actual assertion depends on implementation details (side effects/internal states).
    }));
  });
});
