import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppSettingsService, MockTraceService, TraceService } from '@gms-flex/services-common';
import { asapScheduler } from 'rxjs';

import { GmsSubscription, SubscriptionState } from '../shared/subscription/gms-subscription';
import { SubscriptionGmsVal, SubscriptionWsiVal, ValueDetails } from '../wsi-proxy-api/shared/data.model';
import { ValueSubscriptionProxyServiceBase } from '../wsi-proxy-api/values-subscriptions/value-subscription-proxy.service.base';
import { ValueSubscriptionProxyMockService } from './value-subscription-proxy.mock.service';
import { ValueSubscription2Service } from './value-subscription2.service';
import { ValueSubscription2ServiceBase } from './value-subscription2.service.base';

// Tests  /////////////
describe('ValueSubscription2Service: Complex Use Case', () => {

  let trace: TraceService;
  let valueSubscriptionService: ValueSubscription2ServiceBase;
  let mockSubscriptionProxy: ValueSubscriptionProxyMockService;
  const objectId1 = 'objectId1';
  const objectId2 = 'objectId2';
  const objectId3 = 'objectId3';
  const objectId4 = 'objectId4';
  const objectId5 = 'objectId5';
  const clientId1 = 'clientId1';
  const clientId2 = 'clientId2';
  let keyCounter = 0;
  let valSubsClient1: GmsSubscription<ValueDetails>[] = [];
  let valSubsClient2: GmsSubscription<ValueDetails>[] = [];
  const valueNotifiesPerValueSubscription: Map<number, ValueDetails[]> = new Map<number, ValueDetails[]>();
  const stateNotifiesPerValueSubscription: Map<number, SubscriptionState[]> = new Map<number, SubscriptionState[]>();
  let clientId1Key: string;
  let clientId2Key: string;
  const valLevelEnd = 9;
  const valLevelObject2SubscribeClient2 = 4;
  const valLevelObject3Disconnect = 4;
  let disconnectDone = false;
  let subscribeClient2Done = false;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: 'appSettingFilePath', useValue: 'noMatter' },
        AppSettingsService,
        { provide: TraceService, useClass: MockTraceService },
        { provide: ValueSubscription2ServiceBase, useClass: ValueSubscription2Service },
        { provide: ValueSubscriptionProxyServiceBase, useClass: ValueSubscriptionProxyMockService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    trace = TestBed.inject(TraceService as Type<TraceService>);
    trace.traceSettings.allModulesEnabled = false;
    valueSubscriptionService = TestBed.inject(ValueSubscription2ServiceBase as Type<ValueSubscription2ServiceBase>);
    mockSubscriptionProxy = TestBed.inject(ValueSubscriptionProxyServiceBase as Type<ValueSubscriptionProxyMockService>);
    keyCounter = 0;
    disconnectDone = false;
    subscribeClient2Done = false;

  }));

  /* eslint-disable @typescript-eslint/naming-convention */

  const getSubscribReply = (objectOrPropertyIds: string[], errorCode: number): SubscriptionGmsVal[] => {
    const subsWsi: SubscriptionGmsVal[] = [];
    objectOrPropertyIds.forEach(id => {
      const subWsiVal: SubscriptionWsiVal = {
        Key: keyCounter, OriginalObjectOrPropertyId: id, PropertyId: 'Present_Value', ErrorCode: errorCode, RequestId: '0',
        AttributeId: '', ObjectId: '', PropertyName: '', RequestFor: '' };
      const subGms: SubscriptionGmsVal = new SubscriptionGmsVal(subWsiVal);
      keyCounter = keyCounter + 1;
      subsWsi.push(subGms);
    });
    return subsWsi;
  };

  /* eslint-enable @typescript-eslint/naming-convention */

  const onValueChangedClient1 = (value: ValueDetails, vsId: number, gmsId: string, done: DoneFn): void => {
    valueNotifiesPerValueSubscription.get(vsId)?.push(value);
    if ((Number(value.Value.Value) >= valLevelEnd) && (disconnectDone === true)) {
      const vs: GmsSubscription<ValueDetails> | undefined = valSubsClient1.find(val => val.gmsId === gmsId);
      mockSubscriptionProxy.stopEmitingValues(vs!.gmsId);
      valueSubscriptionService.unsubscribeValues([vs!], clientId1Key);
    }

    if ((Number(value.Value.Value) === valLevelObject2SubscribeClient2) &&
        (subscribeClient2Done === false)) {
      subscribeClient2Done = true;
      const objIdsClientId2: string[] = [objectId2, objectId3];
      const task: () => void = () => {
        subscribeForClient2(objIdsClientId2, done);
      };
      asapScheduler.schedule(task);
    }
  };

  const onStateChangedClient1 = (state: SubscriptionState, objectOrPropertyId: string, vsId: number, done: DoneFn): void => {
    stateNotifiesPerValueSubscription.get(vsId)?.push(state);
    if (state === SubscriptionState.Subscribed) {
      mockSubscriptionProxy.startEmitingValues(objectOrPropertyId);
    }
    checkAllUnsubscribedDone(done);
  };

  const onValueChangedClient2 = (value: ValueDetails, vsId: number, gmsId: string, gmsIddone: DoneFn): void => {
    valueNotifiesPerValueSubscription.get(vsId)?.push(value);
    if ((Number(value.Value.Value) >= valLevelEnd) && (disconnectDone === true)) {
      const vs: GmsSubscription<ValueDetails> | undefined = valSubsClient2.find(val => val.gmsId === gmsId);
      mockSubscriptionProxy.stopEmitingValues(vs!.gmsId);
      valueSubscriptionService.unsubscribeValues([vs!], clientId2Key);
    }

    if ((Number(value.Value.Value) === valLevelObject3Disconnect) && (disconnectDone === false)) {
      disconnectDone = true;
      mockSubscriptionProxy.stopEmitingValues(objectId1);
      mockSubscriptionProxy.stopEmitingValues(objectId2);
      mockSubscriptionProxy.stopEmitingValues(objectId3);
      const task: () => void = () => {
        mockSubscriptionProxy.notifyDisconnect();
        mockSubscriptionProxy.notifyReconnect();
      };
      asapScheduler.schedule(task);
    }
  };

  const onStateChangedClient2 = (state: SubscriptionState, objectOrPropertyId: string, vsId: number, done: DoneFn): void => {
    stateNotifiesPerValueSubscription.get(vsId)?.push(state);
    if (state === SubscriptionState.Subscribed) {
      mockSubscriptionProxy.startEmitingValues(objectOrPropertyId);
    }
    checkAllUnsubscribedDone(done);
  };

  const checkValueSubcriptionStat = (sub: GmsSubscription<ValueDetails>, objectOrPropertyIdExp: string, clientIdExp: string): void => {
    expect(sub.gmsId).toBe(objectOrPropertyIdExp, 'Checking expected objectOrPropertyId.');
    expect(sub.clientId).toBe(clientIdExp, 'Checking expected clientId.');
  };

  const checkValueSubcription = (sub: GmsSubscription<ValueDetails>, stateExp: SubscriptionState, errorCodeExp: number, connectionOKExp: boolean): void => {
    expect(sub.state).toBe(stateExp, 'Checking expected state.');
    expect(sub.errorCode).toBe(errorCodeExp, 'Checking expected errorCode.');
    expect(sub.connectionOK).toBe(connectionOKExp, 'Checking expected connectionOK.');
  };

  const init = (): void => {
    valueNotifiesPerValueSubscription.clear();
    stateNotifiesPerValueSubscription.clear();
    valSubsClient1 = [];
    valSubsClient2 = [];
  };

  const checkAllUnsubscribedDone = (done: DoneFn): void => {
    let allDone = true;
    valSubsClient1.forEach(vs => {
      if (vs.state !== SubscriptionState.Unsubscribed) {
        allDone = false;
      }
    });
    valSubsClient2.forEach(vs => {
      if (vs.state !== SubscriptionState.Unsubscribed) {
        allDone = false;
      }
    });
    if (allDone) {
      doAllChecks();
      done();
    }
  };

  const doAllChecks = (): void => {
    // Expectation for the 2 subscriptions (objectId1 and objectId2) of client 1:
    // Value notifications received: Values count up from 0 to 9 and after the resubscribe again from 0 to 9
    // State notifications received: Subscribing -> Subscribed -> Resubscribe Pending -> Subscribing -> Subscribed -> Unsubscribed
    valSubsClient1.forEach(vs => {
      expect(valueNotifiesPerValueSubscription.get(vs.id)?.length).toBe(15, '20 value notifications expected');
      expect(valueNotifiesPerValueSubscription.get(vs.id)![0].Value.Value).toBe('0', 'Value 0 expected');
      expect(valueNotifiesPerValueSubscription.get(vs.id)![9].Value.Value).toBe('4', 'Value 4 expected');
      expect(valueNotifiesPerValueSubscription.get(vs.id)![10].Value.Value).toBe('5', 'Value 5 expected');
      expect(valueNotifiesPerValueSubscription.get(vs.id)![14].Value.Value).toBe('9', 'Value 9 expected');
      expect(stateNotifiesPerValueSubscription.get(vs.id)?.length).toBe(6, '6 state notifications expected');
      expect(stateNotifiesPerValueSubscription.get(vs.id)![0]).toBe(SubscriptionState.Subscribing, 'State Subscribing expected');
      expect(stateNotifiesPerValueSubscription.get(vs.id)![1]).toBe(SubscriptionState.Subscribed, 'State Unsubscribed expected');
      expect(stateNotifiesPerValueSubscription.get(vs.id)![2]).toBe(SubscriptionState.ResubscribePending, 'State ResubscribePending expected');
      expect(stateNotifiesPerValueSubscription.get(vs.id)![3]).toBe(SubscriptionState.Subscribing, 'State Subscribing expected');
      expect(stateNotifiesPerValueSubscription.get(vs.id)![4]).toBe(SubscriptionState.Subscribed, 'State Subscribed expected');
      expect(stateNotifiesPerValueSubscription.get(vs.id)![5]).toBe(SubscriptionState.Unsubscribed, 'State Unsubscribed expected');
    });
    valSubsClient2.forEach(vs => {
      if (vs.gmsId === objectId2) {
        // Expectation for the subscription (objectId2) of client 2:
        // Value notifications received: Values count up from 4 to 9 and after the resubscribe again from 0 to 9
        // State notifications received: Subscribed -> Resubscribe Pending -> Subscribing -> Subscribed -> Unsubscribed
        // Note: the subscription has been done after the first subscription of object2 by client1 has emitted value 0 to 4.
        // Due to the ReplaySubject, the new subscription of client2 gets the value 4 as well.
        expect(valueNotifiesPerValueSubscription.get(vs.id)?.length).toBe(12, '12 value notifications expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![0].Value.Value).toBe('3', 'Value 3 expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![5].Value.Value).toBe('3', 'Value 3 expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![6].Value.Value).toBe('4', 'Value 4 expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![11].Value.Value).toBe('9', 'Value 9 expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)?.length).toBe(5, '5 state notifications expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![0]).toBe(SubscriptionState.Subscribed, 'State Unsubscribed expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![1]).toBe(SubscriptionState.ResubscribePending, 'State ResubscribePending expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![2]).toBe(SubscriptionState.Subscribing, 'State Subscribing expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![3]).toBe(SubscriptionState.Subscribed, 'State Subscribed expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![4]).toBe(SubscriptionState.Unsubscribed, 'State Unsubscribed expected');
      } else {
        // Expectation for the subscription (objectId3) of client 3:
        // Value notifications received: Values count up from 0 to 4 and after the resubscribe again from 0 to 9
        // State notifications received: Subscribing -> Subscribed -> Resubscribe Pending -> Subscribing -> Subscribed -> Unsubscribed
        // Note: the subscription has been done after the first subscription of objectId2 by client1 has emitted value 0 to 4.
        expect(valueNotifiesPerValueSubscription.get(vs.id)?.length).toBe(10, '10 value notifications expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![0].Value.Value).toBe('0', 'Value 0 expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![4].Value.Value).toBe('4', 'Value 4 expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![5].Value.Value).toBe('5', 'Value 5 expected');
        expect(valueNotifiesPerValueSubscription.get(vs.id)![9].Value.Value).toBe('9', 'Value 9 expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)?.length).toBe(6, '6 state notifications expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![0]).toBe(SubscriptionState.Subscribing, 'State Subscribing expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![1]).toBe(SubscriptionState.Subscribed, 'State Unsubscribed expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![2]).toBe(SubscriptionState.ResubscribePending, 'State ResubscribePending expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![3]).toBe(SubscriptionState.Subscribing, 'State Subscribing expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![4]).toBe(SubscriptionState.Subscribed, 'State Subscribed expected');
        expect(stateNotifiesPerValueSubscription.get(vs.id)![5]).toBe(SubscriptionState.Unsubscribed, 'State Unsubscribed expected');
      }
    });
  };

  const subscribeForClient1 = (objIdsClientId1: string[], done: DoneFn): void => {
    clientId1Key = valueSubscriptionService.registerClient(clientId1);
    valSubsClient1 = valueSubscriptionService.subscribeValues([objectId1, objectId2], clientId1Key);
    valSubsClient1.forEach((sub, index) => {
      valueNotifiesPerValueSubscription.set(sub.id, []);
      sub.changed.subscribe(val => onValueChangedClient1(val, sub.id, sub.gmsId, done));
      stateNotifiesPerValueSubscription.set(sub.id, []);
      sub.stateChanged.subscribe(state => onStateChangedClient1(state, sub.gmsId, sub.id, done));
      checkValueSubcriptionStat(sub, objIdsClientId1[index], clientId1Key);
      checkValueSubcription(sub, SubscriptionState.Subscribing, undefined!, undefined!);
    });
  };

  const subscribeForClient2 = (objIdsClientId2: string[], done: DoneFn): void => {
    clientId2Key = valueSubscriptionService.registerClient(clientId2);
    valSubsClient2 = valueSubscriptionService.subscribeValues(objIdsClientId2, clientId2Key);
    valSubsClient2.forEach((sub, index) => {
      valueNotifiesPerValueSubscription.set(sub.id, []);
      sub.changed.subscribe(val => onValueChangedClient2(val, sub.id, sub.gmsId, done));
      stateNotifiesPerValueSubscription.set(sub.id, []);
      sub.stateChanged.subscribe(state => onStateChangedClient2(state, sub.gmsId, sub.id, done));
      checkValueSubcriptionStat(sub, objIdsClientId2[index], clientId2Key);
      if (sub.gmsId === objectId2) {
        expect(sub.state).toBe(SubscriptionState.Subscribed, 'Checking expected state.');
      } else {
        checkValueSubcription(sub, SubscriptionState.Subscribing, undefined!, undefined!);
      }

    });
  };

  it('ValueSubscription2Service: Create subscriptions for client 1 -> create subscriptions for client 2 -> disconnect() -> reconnect() - unsubscribe',
    (done: DoneFn) => {
      const objIdsClientId1: string[] = [objectId1, objectId2];
      const objIdsAll: string[] = [objectId1, objectId2, objectId3];
      init();
      mockSubscriptionProxy.setSubcribeReply(getSubscribReply(objIdsAll, 0));
      subscribeForClient1(objIdsClientId1, done);
    }
  );

});
