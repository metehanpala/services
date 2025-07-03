import { Type } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { SubscriptionDeleteWsi, SubscriptionGms, ValueDetails } from '../../wsi-proxy-api/shared/data.model';
import { GmsSubscription, SubscriptionState } from './gms-subscription';
import { GmsSubscriptionStore } from './gms-subscription-store';

// Tests  /////////////
describe('GmsSubscriptionStore<T>', () => {

  let trace: TraceService;
  let store: GmsSubscriptionStore<ValueDetails>;
  const objectId1 = 'objectId1';
  const objectId2 = 'objectId2';
  const objectId3 = 'objectId3';
  const objectId4 = 'objectId4';
  const objectId5 = 'objectId5';
  const clientId1 = 'clientId1';
  const clientId2 = 'clientId2';
  const clientId3 = 'clientId3';
  const clientId4 = 'clientId4';
  let resultCreate: { toBeSubscribed: string[]; gmsSubscriptions: GmsSubscription<ValueDetails>[] } = null!;
  let valSubsClient1: GmsSubscription<ValueDetails>[] = [];
  let valSubsClient2: GmsSubscription<ValueDetails>[] = [];
  let valSubsClient3: GmsSubscription<ValueDetails>[] = [];
  let resultRemove: { toBeUnsubscribedKeys: number[]; toBeUnsubscribedIds: string[] };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService }
      ]
    })
      .compileComponents();

    trace = TestBed.inject(TraceService as Type<TraceService>);
    trace.traceSettings.allModulesEnabled = false;
    store = new GmsSubscriptionStore<ValueDetails>(trace, 'testModule', undefined!);
    store.registerClientId(clientId1);
    store.registerClientId(clientId2);
    store.registerClientId(clientId3);

  }));

  it('GmsSubscriptionStore<T>: Create mixed subscriptions for 3 clients -> Remove subscriptions',
    () => {
      resultCreate = null!;
      valSubsClient2 = [];
      resultCreate = store.createSubscriptions([objectId2, objectId2, objectId3], clientId2);
      valSubsClient2.push(...resultCreate.gmsSubscriptions);
      expect(resultCreate.toBeSubscribed.length).toBe(2, 'Two ids must be subscribed');
      expect(resultCreate.toBeSubscribed[0]).toBe(objectId2);
      expect(resultCreate.toBeSubscribed[1]).toBe(objectId3);
      expect(resultCreate.gmsSubscriptions.length).toBe(3, 'Three subscriptions requested!');
      expect(resultCreate.gmsSubscriptions[0].gmsId).toBe(objectId2);
      expect(resultCreate.gmsSubscriptions[0].clientId).toBe(clientId2);
      expect(resultCreate.gmsSubscriptions[1].gmsId).toBe(objectId2);
      expect(resultCreate.gmsSubscriptions[1].clientId).toBe(clientId2);
      expect(resultCreate.gmsSubscriptions[2].gmsId).toBe(objectId3);
      expect(resultCreate.gmsSubscriptions[2].clientId).toBe(clientId2);

      valSubsClient1 = [];
      resultCreate = store.createSubscriptions([objectId1], clientId1);
      valSubsClient1.push(...resultCreate.gmsSubscriptions);
      expect(resultCreate.toBeSubscribed.length).toBe(1, 'One id must be subscribed');
      expect(resultCreate.toBeSubscribed[0]).toBe(objectId1);
      expect(resultCreate.gmsSubscriptions.length).toBe(1);
      expect(resultCreate.gmsSubscriptions[0].gmsId).toBe(objectId1);
      expect(resultCreate.gmsSubscriptions[0].clientId).toBe(clientId1);

      resultCreate = store.createSubscriptions([objectId5, objectId3, objectId4], clientId1);
      valSubsClient1.push(...resultCreate.gmsSubscriptions);
      expect(resultCreate.toBeSubscribed.length).toBe(2, 'Two ids must be subscribed');
      expect(resultCreate.toBeSubscribed[0]).toBe(objectId5);
      expect(resultCreate.gmsSubscriptions.length).toBe(3, 'Three subscriptions requested!');
      expect(resultCreate.gmsSubscriptions[0].gmsId).toBe(objectId5);
      expect(resultCreate.gmsSubscriptions[1].gmsId).toBe(objectId3);
      expect(resultCreate.gmsSubscriptions[2].gmsId).toBe(objectId4);

      // client1: objecttId1, objecttId3, objecttId4, objecttId5
      expect(store.getNoOfGmsSubscriptions(clientId1)).toBe(4, 'Four subscription for client 1');
      // client2: objecttId2, objecttId2, objecttId3
      expect(store.getNoOfGmsSubscriptions(clientId2)).toBe(3, 'Three subscription for client 2');
      // client3: objecttId2, objecttId2, objecttId3, objecttId4
      expect(store.getNoOfGmsSubscriptions(clientId3)).toBe(0, 'Zero subscription for client 3');
      expect(store.getNoOfGmsSubscriptions(clientId4)).toBeUndefined();

      expect(store.getActiveGmsSubscriptionFsms(objectId1).size).toBe(1, 'One subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId2).size).toBe(2, 'Two subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId3).size).toBe(2, 'Two subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId4).size).toBe(1, 'One subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId5).size).toBe(1, 'One subscription done.');
      expect(store.countActiveSubscriptions()).toBe(5, '5 shared active subscriptions');
      expect(store.countInactiveSubscriptions()).toBe(0, '0 shared inactive subscriptions');

      let subWsi: SubscriptionGms[] = [];
      subWsi.push({ key: 0, originalId: objectId1, propertyId: 'Prop1', errorCode: 0 });
      subWsi.push({ key: 1, originalId: objectId2, propertyId: 'Prop1', errorCode: 0 });
      subWsi.push({ key: 2, originalId: objectId3, propertyId: 'Prop1', errorCode: 0 });
      subWsi.push({ key: 3, originalId: objectId4, propertyId: 'Prop1', errorCode: 0 });
      subWsi.push({ key: 4, originalId: objectId5, propertyId: 'Prop1', errorCode: 0 });
      store.subscribeReply(subWsi);

      resultRemove = null!;
      // removing subscriptions
      resultRemove = store.removeSubscriptions(valSubsClient1, clientId1);
      expect(resultRemove.toBeUnsubscribedKeys.length).toBe(3, 'Three object (objectId1 object4 and object5) to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedKeys[0]).toBe(0, 'Key must be 0');
      expect(resultRemove.toBeUnsubscribedIds[0]).toBe(objectId1, 'objectId1 to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedKeys[1]).toBe(4, 'Key must be 4');
      expect(resultRemove.toBeUnsubscribedIds[1]).toBe(objectId5, 'objectId5 to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedKeys[2]).toBe(3, 'Key must be 3');
      expect(resultRemove.toBeUnsubscribedIds[2]).toBe(objectId4, 'objectId4 to be unsubscribed');
      valSubsClient1 = [];

      resultRemove = store.removeSubscriptions([valSubsClient2[2]], clientId2);

      expect(resultRemove.toBeUnsubscribedKeys.length).toBe(1, 'objectId3 to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedIds.length).toBe(1, 'Key must be 0');

      valSubsClient2.pop();

      resultRemove = store.removeSubscriptions(valSubsClient2, clientId2);
      expect(resultRemove.toBeUnsubscribedKeys.length).toBe(1, 'objectId2 to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedIds.length).toBe(1, 'Key must be 0');

      let subDelWsi: SubscriptionDeleteWsi[] = [];
      /* eslint-disable @typescript-eslint/naming-convention */
      subDelWsi.push({ Key: 0, ErrorCode: 0 });
      subDelWsi.push({ Key: 1, ErrorCode: 0 });
      subDelWsi.push({ Key: 2, ErrorCode: 0 });
      subDelWsi.push({ Key: 3, ErrorCode: 0 });
      subDelWsi.push({ Key: 4, ErrorCode: 0 });
      /* eslint-enable @typescript-eslint/naming-convention */
      store.unsubscribeReply(subDelWsi, [objectId1, objectId2, objectId3, objectId4, objectId5]);

      valSubsClient2 = [];

      valSubsClient3 = [];
      resultCreate = store.createSubscriptions([objectId2, objectId3], clientId3);
      valSubsClient3.push(...resultCreate.gmsSubscriptions);
      // expect(resultCreate.toBeSubscribed.length).toBe(2, "Two subscriptions requested!");
      expect(resultCreate.gmsSubscriptions.length).toBe(2, 'Two subscriptions requested!');
      expect(resultCreate.gmsSubscriptions[0].gmsId).toBe(objectId2);
      expect(resultCreate.gmsSubscriptions[1].gmsId).toBe(objectId3);

      resultCreate = store.createSubscriptions([objectId2, objectId4], clientId3);
      valSubsClient3.push(...resultCreate.gmsSubscriptions);
      // expect(resultCreate.toBeSubscribed.length).toBe(1, "One Id needs to be subscribed.");
      expect(resultCreate.toBeSubscribed[0]).toBe(objectId4);
      expect(resultCreate.gmsSubscriptions.length).toBe(2, 'Two subscriptions requested!');
      expect(resultCreate.gmsSubscriptions[0].gmsId).toBe(objectId2);
      expect(resultCreate.gmsSubscriptions[1].gmsId).toBe(objectId4);

      subWsi = [];
      subWsi.push({ key: 0, originalId: objectId2, propertyId: 'Prop1', errorCode: 0 });
      subWsi.push({ key: 1, originalId: objectId3, propertyId: 'Prop1', errorCode: 0 });
      subWsi.push({ key: 2, originalId: objectId4, propertyId: 'Prop1', errorCode: 0 });
      store.subscribeReply(subWsi);

      resultRemove = store.removeSubscriptions(valSubsClient3, clientId3);
      expect(resultRemove.toBeUnsubscribedKeys.length).toBe(3, 'Three objects to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedIds.length).toBe(3, 'Three objects to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedIds[1]).toBe(objectId2, 'objectId2 to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedIds[0]).toBe(objectId3, 'objectId3 to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedIds[2]).toBe(objectId4, 'objectId4 to be unsubscribed');
      expect(resultRemove.toBeUnsubscribedKeys[1]).toBe(0, 'Key must be 0');
      expect(resultRemove.toBeUnsubscribedKeys[0]).toBe(1, 'Key must be 1');
      expect(resultRemove.toBeUnsubscribedKeys[2]).toBe(2, 'Key must be 2');
      valSubsClient3 = [];

      expect(store.getNoOfGmsSubscriptions(clientId1)).toBe(0, 'Zero subscription for client 1');
      expect(store.getNoOfGmsSubscriptions(clientId2)).toBe(0, 'Zero subscription for client 2');
      expect(store.getNoOfGmsSubscriptions(clientId3)).toBe(0, 'Zero subscription for client 3');

      expect(store.getActiveGmsSubscriptionFsms(objectId1).size).toBe(0, 'Zero subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId2).size).toBe(0, 'Zero subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId3).size).toBe(0, 'Zero subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId4).size).toBe(0, 'Zero subscription done.');
      expect(store.getActiveGmsSubscriptionFsms(objectId5).size).toBe(0, 'Zero subscription done.');
      expect(store.countActiveSubscriptions()).toBe(0, '0 active subscriptions');
      expect(store.countInactiveSubscriptions()).toBe(3, 'Still 3 inactive subscriptions');

      subDelWsi = [];
      /* eslint-disable @typescript-eslint/naming-convention */
      subDelWsi.push({ Key: 0, ErrorCode: 0 });
      subDelWsi.push({ Key: 1, ErrorCode: 0 });
      subDelWsi.push({ Key: 2, ErrorCode: 0 });
      subDelWsi.push({ Key: 3, ErrorCode: 0 });
      subDelWsi.push({ Key: 4, ErrorCode: 0 });
      /* eslint-enable @typescript-eslint/naming-convention */
      store.unsubscribeReply(subDelWsi, [objectId1, objectId2, objectId3, objectId4, objectId5]);
      expect(store.countActiveSubscriptions()).toBe(0, 'Zero active subscriptions');
      expect(store.countInactiveSubscriptions()).toBe(0, 'Zero inactive subscriptions');
    }
  );

  const initClient1WithObject1AndObject2 = (): void => {
    valSubsClient1 = [];
  };

  const initClient2WithObject3AndObject4 = (): void => {
    valSubsClient1 = [];
  };

  const subscribeClient1WithObject1AndObject2 = (): void => {
    resultCreate = store.createSubscriptions([objectId1, objectId2], clientId1);
    valSubsClient1.push(...resultCreate.gmsSubscriptions);
  };

  const subscribeReplyClient1WithObject1AndObject2 = (wsiKeys: number[], wsiErrorCode: number[]): void => {
    if (wsiKeys != undefined) {
      const subWsi: SubscriptionGms[] = [];
      subWsi.push({ key: wsiKeys[0], originalId: objectId1, propertyId: 'Prop1', errorCode: wsiErrorCode[0] });
      subWsi.push({ key: wsiKeys[1], originalId: objectId2, propertyId: 'Prop1', errorCode: wsiErrorCode[1] });
      store.subscribeReply(subWsi);
    } else {
      store.subscribeReplyError([objectId1, objectId2]);
    }
  };

  const unsubscribeClient1WithObject1AndObject2 = (): void => {
    resultRemove = store.removeSubscriptions(valSubsClient1, clientId1);
  };

  const unsubscribeReplyClient1WithObject1AndObject2 = (wsiKeys: number[], wsiErrorCode: number[], objectIds: string[]): void => {
    if ((wsiKeys != undefined) && (wsiErrorCode != undefined)) {
      const subDelWsi: SubscriptionDeleteWsi[] = [];
      /* eslint-disable @typescript-eslint/naming-convention */
      subDelWsi.push({ Key: wsiKeys[0], ErrorCode: wsiErrorCode[0] });
      subDelWsi.push({ Key: wsiKeys[1], ErrorCode: wsiErrorCode[1] });
      /* eslint-enable @typescript-eslint/naming-convention */
      store.unsubscribeReply(subDelWsi, objectIds);
    } else {
      store.unsubscribeReplyError(wsiKeys, objectIds);
    }
  };

  const checkClient1WithObject1AndObject2 = (statesVsm: SubscriptionState[], statesShared: SubscriptionState[],
    wsiKeys: number[], errorCodes: number[], connectionOks: boolean[]): void => {
    expect(valSubsClient1[0].state).toBe(statesVsm[0], 'State check objectId1');
    if (statesVsm[0] !== SubscriptionState.Unsubscribed) {
      expect(valSubsClient1[0].errorCode).toBe(errorCodes[0], 'Error code check objectId1.');
      expect(valSubsClient1[0].connectionOK).toBe(connectionOks[0], 'ConnectionOK check objectId1');
    }
    expect(valSubsClient1[1].state).toBe(statesVsm[1], 'State check objectId2');
    if (statesVsm[1] !== SubscriptionState.Unsubscribed) {
      expect(valSubsClient1[1].errorCode).toBe(errorCodes[1], 'Error code check objectId2');
      expect(valSubsClient1[1].connectionOK).toBe(connectionOks[1], 'ConnectionOK check objectId2');
    }
    if ((statesShared[0] !== SubscriptionState.Unsubscribing) && (statesShared[0] !== SubscriptionState.Unsubscribed)) {
      expect(store.getActiveSubscription(objectId1)?.state).toBe(statesShared[0], 'Check shared subscription state for objectId1');
      if (wsiKeys[0] != undefined) {
        expect(store.getActiveSubscription(objectId1)?.subscriptionWsi?.key).toBe(wsiKeys[0], 'Wsi Key check objectId1');
        expect(store.getActiveSubscription(objectId1)?.subscriptionWsi?.errorCode).toBe(errorCodes[0], 'Error code check objectId2');
      } else {
        expect(store.getActiveSubscription(objectId1)?.subscriptionWsi).toBeUndefined('Wsi key unddefined for objectId1');
      }
    }
    if ((statesShared[0] !== SubscriptionState.Unsubscribing) && (statesShared[1] !== SubscriptionState.Unsubscribed)) {
      expect(store.getActiveSubscription(objectId2)?.state).toBe(statesShared[1], 'Check shared subscription state for objectId2');
      if (wsiKeys[1] != undefined) {
        expect(store.getActiveSubscription(objectId2)?.subscriptionWsi?.key).toBe(wsiKeys[1], 'Wsi Key check objectId2');
        expect(store.getActiveSubscription(objectId2)?.subscriptionWsi?.errorCode).toBe(errorCodes[1], 'Error code check objectId2');
      } else {
        expect(store.getActiveSubscription(objectId2)?.subscriptionWsi).toBeUndefined('Wsi key unddefined for objectId2');
      }
    }
  };

  const subscribeClient2WithObject3AndObject4 = (): void => {
    resultCreate = store.createSubscriptions([objectId3, objectId4], clientId2);
    valSubsClient2.push(...resultCreate.gmsSubscriptions);
  };

  const subscribeReplyClient1WithObject3AndObject4 = (wsiKeys: number[], wsiErrorCode: number[]): void => {
    if (wsiKeys != undefined) {
      const subWsi: SubscriptionGms[] = [];
      subWsi.push({ key: wsiKeys[0], originalId: objectId3, propertyId: 'Prop1', errorCode: wsiErrorCode[0] });
      subWsi.push({ key: wsiKeys[1], originalId: objectId4, propertyId: 'Prop1', errorCode: wsiErrorCode[1] });
      store.subscribeReply(subWsi);
    } else {
      store.subscribeReplyError([objectId3, objectId4]);
    }
  };

  const unsubscribeClient2WithObject3AndObject4 = (): void => {
    resultRemove = store.removeSubscriptions(valSubsClient2, clientId2);
  };

  const checkClient2WithObject3AndObject4 = (statesVsm: SubscriptionState[], statesShared: SubscriptionState[],
    wsiKeys: number[], errorCodes: number[], connectionOks: boolean[]): void => {
    expect(valSubsClient2[0].state).toBe(statesVsm[0], 'State check objectId3');
    if (statesVsm[0] !== SubscriptionState.Unsubscribed) {
      expect(valSubsClient2[0].errorCode).toBe(errorCodes[0], 'Error code check objectId3.');
      expect(valSubsClient2[0].connectionOK).toBe(connectionOks[0], 'ConnectionOK check objectId3');
    }
    expect(valSubsClient2[1].state).toBe(statesVsm[1], 'State check objectId4');
    if (statesVsm[1] !== SubscriptionState.Unsubscribed) {
      expect(valSubsClient2[1].errorCode).toBe(errorCodes[1], 'Error code check objectId4');
      expect(valSubsClient2[1].connectionOK).toBe(connectionOks[1], 'ConnectionOK check objectId4');
    }
    if ((statesShared[0] !== SubscriptionState.Unsubscribing) && (statesShared[0] !== SubscriptionState.Unsubscribed)) {
      expect(store.getActiveSubscription(objectId3)?.state).toBe(statesShared[0], 'Check shared subscription state for objectId3');
      if (wsiKeys[0] !== undefined) {
        expect(store.getActiveSubscription(objectId3)?.subscriptionWsi?.key).toBe(wsiKeys[0], 'Wsi Key check objectId3');
        expect(store.getActiveSubscription(objectId3)?.subscriptionWsi?.errorCode).toBe(errorCodes[0], 'Error code check objectId3');
      } else {
        expect(store.getActiveSubscription(objectId3)?.subscriptionWsi).toBeUndefined('Wsi key unddefined for objectId3');
      }
    }
    if ((statesShared[0] !== SubscriptionState.Unsubscribing) && (statesShared[1] !== SubscriptionState.Unsubscribed)) {
      expect(store.getActiveSubscription(objectId4)?.state).toBe(statesShared[1], 'Check shared subscription state for objectId4');
      if (wsiKeys[1] !== undefined) {
        expect(store.getActiveSubscription(objectId4)?.subscriptionWsi?.key).toBe(wsiKeys[1], 'Wsi Key check objectId4');
        expect(store.getActiveSubscription(objectId4)?.subscriptionWsi?.errorCode).toBe(errorCodes[1], 'Error code check objectId4');
      } else {
        expect(store.getActiveSubscription(objectId4)?.subscriptionWsi).toBeUndefined('Wsi key unddefined for objectId4');
      }
    }
  };

  it('GmsSubscriptionStore<T>: Create subscriptions (2 clients) -> subscribeReply(true) -> unsubscribe subscriptions',
    () => {
      initClient1WithObject1AndObject2();
      initClient2WithObject3AndObject4();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0]);
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribed, SubscriptionState.Subscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Subscribed], [0, 1], [0, 0], [true, true]);

      subscribeClient2WithObject3AndObject4();
      checkClient2WithObject3AndObject4([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
      subscribeReplyClient1WithObject3AndObject4([2, 3], [0, 0]);
      checkClient2WithObject3AndObject4([SubscriptionState.Subscribed, SubscriptionState.Subscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Subscribed], [2, 3], [0, 0], [true, true]);

      unsubscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribing, SubscriptionState.Unsubscribing], [0, 1], [0, 0], [true, true]);
      unsubscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0], [objectId1, objectId2]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [0, 1], [0, 0], [true, true]);

      unsubscribeClient2WithObject3AndObject4();
      checkClient2WithObject3AndObject4([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribing, SubscriptionState.Unsubscribing], [2, 3], [0, 0], [true, true]);
      unsubscribeReplyClient1WithObject1AndObject2([2, 3], [0, 0], [objectId3, objectId4]);
      checkClient2WithObject3AndObject4([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [2, 3], [0, 0], [true, true]);

    }
  );

  it('GmsSubscriptionStore<T>: Create subscriptions (1 clients) -> subscribeReply(true) -> unsubscribe subscriptions (with error)',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0]);
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribed, SubscriptionState.Subscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Subscribed], [0, 1], [0, 0], [true, true]);

      unsubscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribing, SubscriptionState.Unsubscribing], [0, 1], [0, 0], [true, true]);
      unsubscribeReplyClient1WithObject1AndObject2([0, 1], undefined!, [objectId1, objectId2]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [0, 1], [0, 1], [true, true]);

    }
  );

  it('GmsSubscriptionStore<T>: Create subscriptions (1 client) -> subscribeReply(errorCode!=0) -> unsubscribe subscriptions',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
      // reply with errorCode=1 for objectId2
      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 1]);
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Unsubscribed], [0, 1], [0, 1], [true, true]);

      unsubscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribing, SubscriptionState.Unsubscribed], [0, 1], [0, 1], [true, true]);
      unsubscribeReplyClient1WithObject1AndObject2([0, 1], [0, 1], [objectId1, objectId2]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [0, 1], [0, 1], [true, true]);

    }
  );

  it('GmsSubscriptionStore<T>: Create subscriptions (1 client) -> subscribeReply(false) -> unsubscribe subscriptions',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);

      // reply false for both objects
      subscribeReplyClient1WithObject1AndObject2(undefined!, undefined!);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
    }
  );

  it('GmsSubscriptionStore<T>: Create subscriptions (1 client) -> unsubscribe subscriptions -> subscribeReply(errorCode==0)',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);

      unsubscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);

      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribing, SubscriptionState.Unsubscribing], [0, 1], [0, 0], [true, true]);

      unsubscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0], [objectId1, objectId2]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [0, 1], [0, 0], [true, true]);

    }
  );

  it('GmsSubscriptionStore<T>: Create subscriptions (1 client) -> unsubscribe subscriptions -> subscribeReply(errorCode!=0)',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);

      unsubscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);

      // reply with errorCode=1 for both objects:
      subscribeReplyClient1WithObject1AndObject2([0, 1], [1, 1]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [0, 1], [1, 1], [true, true]);

      unsubscribeReplyClient1WithObject1AndObject2([0, 1], [1, 1], [objectId1, objectId2]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [0, 1], [1, 1], [true, true]);

    }
  );

  it('GmsSubscriptionStore<T>: Create subscriptions (1 client) -> subscribeReply(true) -> signalR disconnect -> signalR reconnect -> unsubscribe',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0]);
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribed, SubscriptionState.Subscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Subscribed], [0, 1], [0, 0], [true, true]);

      store.notifyChannelDisconnected();
      checkClient1WithObject1AndObject2([SubscriptionState.ResubscribePending, SubscriptionState.ResubscribePending],
        [SubscriptionState.ResubscribePending, SubscriptionState.ResubscribePending], [0, 1], [0, 0], [true, true]);

      const objToResubscribe: string[] = store.notifyChannelReconnected();
      expect(objToResubscribe[0]).toBe(objectId1, 'ObjectId1 needs to be resubscribed');
      expect(objToResubscribe[1]).toBe(objectId2, 'ObjectId2 needs to be resubscribed');

      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);

      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0]);
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribed, SubscriptionState.Subscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Subscribed], [0, 1], [0, 0], [true, true]);

      unsubscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribing, SubscriptionState.Unsubscribing], [0, 1], [0, 0], [true, true]);
      unsubscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0], [objectId1, objectId2]);
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed], [0, 1], [0, 0], [true, true]);
    }
  );

  it('GmsSubscriptionStore<T>: Create subscriptions -> subscribeReply(true) -> unsubscribe subscriptions -> Create the same subsriptions',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0]);
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribed, SubscriptionState.Subscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Subscribed], [0, 1], [0, 0], [true, true]);

      unsubscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Unsubscribed, SubscriptionState.Unsubscribed],
        [SubscriptionState.Unsubscribing, SubscriptionState.Unsubscribing], [0, 1], [0, 0], [true, true]);

      valSubsClient1 = [];
      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);
      subscribeReplyClient1WithObject1AndObject2([0, 1], [0, 0]);
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribed, SubscriptionState.Subscribed],
        [SubscriptionState.Subscribed, SubscriptionState.Subscribed], [0, 1], [0, 0], [true, true]);
    }
  );

  it('GmsSubscriptionStore<T>: Various positive/negative test cases.',
    () => {
      initClient1WithObject1AndObject2();

      subscribeClient1WithObject1AndObject2();
      checkClient1WithObject1AndObject2([SubscriptionState.Subscribing, SubscriptionState.Subscribing],
        [SubscriptionState.Subscribing, SubscriptionState.Subscribing], [undefined!, undefined!], [undefined!, undefined!], [undefined!, undefined!]);

      expect(store.isActive(objectId1)).toBe(true, 'Subscription for objectId1 in store.');
      expect(store.isActive(objectId3)).toBe(false, 'Subscription for objectId3 not in store.');
      expect(store.getActiveGmsSubscriptionFsms(objectId3).size).toBe(0, 'no values subscription fsm defined!');
    }
  );

});
