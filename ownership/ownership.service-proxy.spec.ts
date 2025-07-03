/**
 * Unit tests for OwnershipServiceProxy.
 *
 * This test suite validates the OwnershipServiceProxy class, which manages
 * ownership operations (fetch, update, subscribe/unsubscribe) and integrates
 * with SignalR for real-time owner change notifications.
 *
 * The service interacts with several dependencies:
 * - HttpClient: Makes API calls.
 * - WsiUtilityService: Provides utility functions and error handling.
 * - SignalRService: Manages SignalR hub for real-time features.
 * - ErrorNotificationServiceBase: Handles error notifications.
 *
 * Each test isolates one aspect of service behavior using Jasmine spies
 * and Angular's testing utilities.
 */

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { NgZone } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthenticationServiceBase, ErrorDisplayItem, ErrorNotificationServiceBase, MockTraceService, TraceService } from '@gms-flex/services-common';
import { Observable, of, Subject, throwError } from 'rxjs';

import { WsiOwner, WsiOwnership } from '../public-api';
import { WsiUtilityService } from '../shared';
import { SignalRService } from '../signalr';
import { WsiEndpointService } from '../wsi-endpoint';
import { OwnershipServiceProxy } from './ownership.service-proxy';

// -----------------------
// Mock Service Definitions
// -----------------------

// Mocks authentication token.
class MockAuthenticationService {
  public userToken = 'mock-token';
}

// Mocks API endpoint URL.
class MockWsiEndpointService {
  public entryPoint = 'http://mock-endpoint';
}

// Provides dummy HTTP headers and error/data handlers.
class MockWsiUtilityService {
  public httpGetDefaultHeader(): HttpHeaders {
    return new HttpHeaders();
  }

  public httpPutDefaultHeader(): HttpHeaders {
    return new HttpHeaders();
  }

  public httpDeleteDefaultHeader(): HttpHeaders {
    return new HttpHeaders();
  }

  public httpPostDefaultHeader(): HttpHeaders {
    return new HttpHeaders();
  }

  public extractData(response: HttpResponse<any>, traceModule: string, method: string): any {
    if (method === 'OwnershipProxyService.unsubscribeOwnership()') {
      return true;
    }
    return response?.body;
  }

  public handleError(error: any, traceModule: string, method: string, errorService: ErrorNotificationServiceBase): Observable<never> {
    return throwError(() => error);
  }
}
// Simulates error notification system.
class MockErrorNotificationService extends ErrorNotificationServiceBase {
  private readonly _errorChanged = new Subject<ErrorDisplayItem>();
  private readonly _errors: ErrorDisplayItem[] = [];

  public get errorChanged(): Observable<ErrorDisplayItem> {
    return this._errorChanged.asObservable();
  }

  public get errors(): ErrorDisplayItem[] {
    return this._errors;
  }

  public notifyErrorChange(): void { }
  public showError(): void { }
}

// Simulates SignalR hub state, connection, and registration logic.
class MockSignalRService {
  private readonly mockHub = {
    hubConnection: {
      connectionState: new Subject<SignalR.ConnectionState>(),
      connected: new Subject<boolean>(),
      disconnected: new Subject<boolean>(),
      isConnected: true,
      connectionStateValue: SignalR.ConnectionState.Connected,
      startHubConnection: jasmine.createSpy('startHubConnection'),
      connectionId: 'test-connection-id'
    },
    registerEventHandler: (proxy: any): void => {
      // Mock implementation of registerEventHandler
    }
  };

  public getNorisHub(): any {
    return this.mockHub;
  }

  public registerProxy(proxy: any): void {
    // Mock implementation of registerProxy
  }

}

// -----------------------
// Test Suite
// -----------------------
describe('OwnershipServiceProxy', () => {
  let service: OwnershipServiceProxy;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let signalRService: SignalRService;
  let wsiEndpointService: WsiEndpointService;
  let wsiUtilityService: WsiUtilityService;
  let traceService: TraceService;
  let ngZone: NgZone;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'delete']);
    TestBed.configureTestingModule({
      providers: [
        OwnershipServiceProxy,
        { provide: HttpClient, useValue: spy },
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: MockErrorNotificationService },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: TraceService, useClass: MockTraceService }
      ]
    });

    service = TestBed.inject(OwnershipServiceProxy);
    httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    signalRService = TestBed.inject(SignalRService);
    wsiEndpointService = TestBed.inject(WsiEndpointService);
    wsiUtilityService = TestBed.inject(WsiUtilityService);
    traceService = TestBed.inject(TraceService);

    // Initialize the service's hubProxyShared
    (service as any).hubProxyShared = signalRService.getNorisHub();
  });

  // Basic creation test
  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // -----------------------
  // Fetch Ownership
  // -----------------------
  describe('fetchOwnership', () => {
    /**
     * Should return the owner when the HTTP request succeeds.
     */
    it('should fetch ownership successfully', fakeAsync(() => {
      const mockOwner: WsiOwner = { data: { owner: 'test-owner' } };
      const mockResponse = new HttpResponse({ body: mockOwner });
      httpClientSpy.get.and.returnValue(of(mockResponse));

      let result: WsiOwner | undefined;
      service.fetchOwnership().subscribe(response => {
        result = response;
      });
      tick();

      expect(result).toEqual(mockOwner);
      expect(httpClientSpy.get).toHaveBeenCalled();
    }));

    /**
     * Should trigger handleError and emit error when HTTP fails.
     */
    it('should handle error when fetching ownership', fakeAsync(() => {
      const mockError = new Error('Network error');
      httpClientSpy.get.and.returnValue(throwError(() => mockError));
      spyOn(wsiUtilityService, 'handleError').and.callThrough();

      let error: Error | undefined;
      service.fetchOwnership().subscribe({
        error: err => {
          error = err;
        }
      });
      tick();

      expect(wsiUtilityService.handleError).toHaveBeenCalled();
      expect(error).toBe(mockError);
    }));
  });

  // -----------------------
  // Update Ownership
  // -----------------------
  describe('updateOwnership', () => {
    /**
     * Should return the updated ownership on HTTP success.
     */
    it('should update ownership successfully', fakeAsync(() => {
      const mockOwnership: WsiOwnership = { data: { owner: 'test-owner' } };
      const mockResponse = new HttpResponse({ body: mockOwnership });
      httpClientSpy.post.and.returnValue(of(mockResponse));

      let result: WsiOwnership | undefined;
      service.updateOwnership(mockOwnership).subscribe(response => {
        result = response;
      });
      tick();

      expect(result).toEqual(mockOwnership);
      expect(httpClientSpy.post).toHaveBeenCalled();
    }));
    /**
         * Should handle error case in ownership update.
         */
    it('should handle error when updating ownership', fakeAsync(() => {
      const mockOwnership: WsiOwnership = { data: { owner: 'test-owner' } };
      const mockError = new Error('Network error');
      httpClientSpy.post.and.returnValue(throwError(() => mockError));
      spyOn(wsiUtilityService, 'handleError').and.callThrough();

      let error: Error | undefined;
      service.updateOwnership(mockOwnership).subscribe({
        error: err => {
          error = err;
        }
      });
      tick();

      expect(wsiUtilityService.handleError).toHaveBeenCalled();
      expect(error).toBe(mockError);
    }));
  });

  // -----------------------
  // Subscribe to Ownership
  // -----------------------
  describe('subscribe', () => {
    /**
     * Should send a subscription request if SignalR is connected.
     */
    it('should subscribe to owner changes when SignalR is connected', fakeAsync(() => {
      // Ensure SignalR is connected
      const hubConnection = (service as any).hubProxyShared.hubConnection;
      hubConnection.isConnected = true;
      hubConnection.connectionId = 'test-connection-id';

      // Any successful response will be mapped to true
      httpClientSpy.post.and.returnValue(of({}));

      let result: boolean | undefined;
      service.subscribe('owner').subscribe(response => {
        result = response;
      });
      tick();

      expect(httpClientSpy.post).toHaveBeenCalled();
    }));
    /**
     * Should trigger SignalR reconnection when disconnected.
     */
    it('should handle subscription when SignalR is disconnected', () => {
      const hubConnection = (service as any).hubProxyShared.hubConnection;
      hubConnection.isConnected = false;

      service.subscribe('owner');

      expect(hubConnection.startHubConnection).toHaveBeenCalled();
    });
    /**
     * Should handle subscription errors correctly.
     */
    it('should handle subscription error', fakeAsync(() => {
      const mockError = new Error('Subscription error');
      httpClientSpy.post.and.returnValue(throwError(() => mockError));

      let error: Error | undefined;
      service.subscribe('owner').subscribe({
        error: err => {
          error = err;
        }
      });
      tick();

      expect(error).toBe(mockError);
    }));
  });

  // -----------------------
  // Unsubscribe from Ownership
  // -----------------------
  describe('unsubscribeOwnership', () => {
    /**
     * Should send an unsubscribe request and extract response data.
     */
    it('should unsubscribe successfully when SignalR is connected', fakeAsync(() => {
      const mockResponse = new HttpResponse({
        body: true,
        status: 200,
        statusText: 'OK'
      });
      httpClientSpy.delete.and.returnValue(of(mockResponse));
      const extractDataSpy = spyOn(wsiUtilityService, 'extractData').and.callThrough();

      let result: boolean | undefined;
      service.unsubscribeOwnership('owner').subscribe(response => {
        result = response;
      });
      tick();

      expect(extractDataSpy).toHaveBeenCalledWith(
        mockResponse,
        'gmsServices_Systems',
        'OwnershipProxyService.unsubscribeOwnership()'
      );
      expect(httpClientSpy.delete).toHaveBeenCalled();
    }));
    /**
         * Should handle unsubscribe errors properly.
         */
    it('should handle unsubscribe error', fakeAsync(() => {
      const mockError = new Error('Unsubscribe error');
      httpClientSpy.delete.and.returnValue(throwError(() => mockError));

      let error: Error | undefined;
      service.unsubscribeOwnership('owner').subscribe({
        error: err => {
          error = err;
        }
      });
      tick();

      expect(error).toBe(mockError);
    }));
  });

  // -----------------------
  // Ownership Change Notification
  // -----------------------
  describe('onChangeOfOwnership', () => {
    /**
 * Should emit event when ownership changes.
 */
    it('should emit ownership notification', fakeAsync(() => {
      const mockOwnershipItem = { data: { owner: 'test-owner' } };
      let notified = false;

      service.ownershipNotification().subscribe(() => {
        notified = true;
      });

      service.onChangeOfOwnership(mockOwnershipItem);
      tick();

      expect(notified).toBe(true);
    }));
  });

  // -----------------------
  // SignalR Connection Handling
  // -----------------------
  describe('SignalR connection handling', () => {
    /**
 * Should clear all subscription contexts on SignalR disconnect.
 */
    it('should clear subscriptions on disconnect', () => {
      const hubConnection = (service as any).hubProxyShared.hubConnection;
      const mockCtx = { postSubject: { error: jasmine.createSpy('error') } };
      (service as any)._subscribeRequestsInvoked.set('test-id', mockCtx);

      hubConnection.connectionState.next(SignalR.ConnectionState.Disconnected);

      expect(mockCtx.postSubject.error).toHaveBeenCalledWith('Notification channel disconnected.');
      expect((service as any)._subscribeRequestsInvoked.size).toBe(0);
    });
    /**
     * Should attempt to reconnect after a disconnection event.
     */
    it('should attempt reconnection after disconnect', fakeAsync(() => {
      const hubConnection = (service as any).hubProxyShared.hubConnection;
      // Set connection state to disconnected first
      hubConnection.connectionState.next(SignalR.ConnectionState.Disconnected);
      hubConnection.connectionStateValue = SignalR.ConnectionState.Disconnected;

      // Then trigger disconnected event
      hubConnection.disconnected.next(true);

      // Wait for reconnect timeout
      tick(5000);

      expect(hubConnection.startHubConnection).toHaveBeenCalled();
    }));
  });

  // -----------------------
  // Component Cleanup
  // -----------------------
  describe('ngOnDestroy', () => {
    /**
 * Should clean up all subscriptions on destroy.
 */
    it('should unsubscribe from all subscriptions', () => {
      const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      (service as any).subscriptions = [mockSubscription];

      service.ngOnDestroy();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
