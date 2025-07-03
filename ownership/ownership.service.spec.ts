/**
 * Unit tests for OwnershipService.
 *
 * This suite verifies the correctness of OwnershipService, which is a higher-level service
 * orchestrating ownership-related operations (fetching, updating, subscribing, unsubscribing,
 * and notifications) through its dependency on OwnershipServiceProxy.
 *
 * Key behaviors tested:
 * - Proxy method delegation for fetch/update/subscribe/unsubscribe.
 * - Error propagation from proxy methods.
 * - Subscription caching logic for subscribeOwnership.
 * - Notification observable behavior.
 *
 * All proxy dependencies are mocked to fully isolate OwnershipService logic.
 */

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { WsiOwner, WsiOwnership } from '../public-api';
import { OwnershipService } from './ownership.service';
import { OwnershipServiceProxy } from './ownership.service-proxy';

describe('OwnershipService', () => {
  let service: OwnershipService;
  let ownershipServiceProxy: jasmine.SpyObj<OwnershipServiceProxy>;

  beforeEach(() => {
    // Create a Jasmine spy for OwnershipServiceProxy with all used methods mocked
    const spy = jasmine.createSpyObj('OwnershipServiceProxy', [
      'fetchOwnership',
      'updateOwnership',
      'subscribe',
      'unsubscribeOwnership',
      'ownershipNotification'
    ]);
    TestBed.configureTestingModule({
      providers: [
        OwnershipService,
        { provide: OwnershipServiceProxy, useValue: spy }
      ]
    });

    service = TestBed.inject(OwnershipService);
    ownershipServiceProxy = TestBed.inject(OwnershipServiceProxy) as jasmine.SpyObj<OwnershipServiceProxy>;
  });

  /**
   * Basic creation test to ensure the service can be instantiated.
   */
  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // ------------------------------------------------------
  // Test group: Fetch Ownership
  // ------------------------------------------------------
  describe('fetchOwnership', () => {
    /**
     * Should delegate fetchOwnership to proxy and return the expected owner on success.
     */
    it('should fetch ownership through proxy', () => {
      const mockOwner: WsiOwner = { data: { owner: 'test-owner' } };
      ownershipServiceProxy.fetchOwnership.and.returnValue(of(mockOwner));

      let result: WsiOwner | undefined;
      service.fetchOwnership().subscribe(response => {
        result = response;
      });

      expect(result).toEqual(mockOwner);
      expect(ownershipServiceProxy.fetchOwnership).toHaveBeenCalled();
    });

    /**
     * Should properly propagate error from proxy if fetchOwnership fails.
     */
    it('should handle error when fetching ownership', () => {
      const mockError = new Error('Network error');
      ownershipServiceProxy.fetchOwnership.and.returnValue(throwError(() => mockError));

      let error: Error | undefined;
      service.fetchOwnership().subscribe({
        error: err => {
          error = err;
        }
      });

      expect(error).toBe(mockError);
    });
  });

  // ------------------------------------------------------
  // Test group: Update Ownership
  // ------------------------------------------------------
  describe('updateOwnership', () => {
    /**
     * Should delegate updateOwnership to proxy and emit the updated ownership on success.
     */
    it('should update ownership through proxy', () => {
      const mockOwnership: WsiOwnership = { data: { owner: 'test-owner' } };
      ownershipServiceProxy.updateOwnership.and.returnValue(of(mockOwnership));

      let result: WsiOwnership | undefined;
      service.updateOwnership(mockOwnership).subscribe(response => {
        result = response;
      });

      expect(result).toEqual(mockOwnership);
      expect(ownershipServiceProxy.updateOwnership).toHaveBeenCalledWith(mockOwnership);
    });

    /**
     * Should propagate errors from proxy's updateOwnership method.
     */
    it('should handle error when updating ownership', () => {
      const mockOwnership: WsiOwnership = { data: { owner: 'test-owner' } };
      const mockError = new Error('Network error');
      ownershipServiceProxy.updateOwnership.and.returnValue(throwError(() => mockError));

      let error: Error | undefined;
      service.updateOwnership(mockOwnership).subscribe({
        error: err => {
          error = err;
        }
      });

      expect(error).toBe(mockError);
    });
  });

  // ------------------------------------------------------
  // Test group: Subscribe Ownership (subscription management)
  // ------------------------------------------------------
  describe('subscribeOwnership', () => {
    /**
     * Should call proxy subscribe and emit true on success.
     * Also sets up ownershipNotification as an observable.
     */
    it('should subscribe to ownership through proxy', () => {
      ownershipServiceProxy.subscribe.and.returnValue(of(true));
      ownershipServiceProxy.ownershipNotification.and.returnValue(of(void 0));

      let result: boolean | undefined;
      service.subscribeOwnership().subscribe(response => {
        result = response;
      });

      expect(result).toBe(true);
      expect(ownershipServiceProxy.subscribe).toHaveBeenCalledWith('ownership');
    });

    /**
     * Should reuse the existing subscription observable and not call proxy subscribe again
     * if already subscribed.
     */
    it('should reuse existing subscription if already subscribed', () => {
      ownershipServiceProxy.subscribe.and.returnValue(of(true));
      ownershipServiceProxy.ownershipNotification.and.returnValue(of(void 0));

      // First subscription triggers the actual call
      service.subscribeOwnership().subscribe();
      // Second subscription should not trigger a new proxy call
      service.subscribeOwnership().subscribe();

      expect(ownershipServiceProxy.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------
  // Test group: Unsubscribe Ownership
  // ------------------------------------------------------
  describe('unsubscribeOwnership', () => {
    /**
     * Should delegate unsubscribeOwnership to proxy and emit true on success.
     */
    it('should unsubscribe ownership through proxy', () => {
      ownershipServiceProxy.unsubscribeOwnership.and.returnValue(of(true));

      let result: boolean | undefined;
      service.unsubscribeOwnership().subscribe(response => {
        result = response;
      });

      expect(result).toBe(true);
      expect(ownershipServiceProxy.unsubscribeOwnership).toHaveBeenCalledWith('ownership');
    });

    /**
     * Should propagate errors from proxy's unsubscribeOwnership method.
     */
    it('should handle error when unsubscribing', () => {
      const mockError = new Error('Unsubscribe error');
      ownershipServiceProxy.unsubscribeOwnership.and.returnValue(throwError(() => mockError));

      let error: Error | undefined;
      service.unsubscribeOwnership().subscribe({
        error: err => {
          error = err;
        }
      });

      expect(error).toBe(mockError);
    });
  });

  // ------------------------------------------------------
  // Test group: Ownership Notification
  // ------------------------------------------------------
  describe('ownershipNotification', () => {
    /**
     * Should return undefined from ownershipNotification() if subscription was never established.
     */
    it('should return undefined if not subscribed', () => {
      const result = service.ownershipNotification();
      expect(result).toBeUndefined();
    });

    /**
     * Should return the notification observable after a successful subscription.
     */
    it('should return observable after subscribing', () => {
      ownershipServiceProxy.subscribe.and.returnValue(of(true));
      ownershipServiceProxy.ownershipNotification.and.returnValue(of(void 0));

      service.subscribeOwnership().subscribe();
      const result = service.ownershipNotification();

      expect(result).toBeTruthy();
    });
  });
});
