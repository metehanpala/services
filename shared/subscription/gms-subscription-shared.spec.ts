import { Type } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { SubscriptionDeleteWsi, SubscriptionGms, ValueDetails } from '../../wsi-proxy-api/shared/data.model';
import { GmsSubscription, SubscriptionState } from './gms-subscription';
import { GmsSubscriptionFsm } from './gms-subscription-fsm';
import { FsmReplyType, GmsSubscriptionFsmReply, GmsSubscriptionShared } from './gms-subscription-shared';

// Tests  /////////////
describe('GmsSubscriptionShared<T>', () => {

  let trace: TraceService;
  let subShared: GmsSubscriptionShared<ValueDetails>;
  const objectId1 = 'objectId1';
  const clientId1 = 'clientId1';
  const clientId2 = 'clientId2';
  const clientId3 = 'clientId3';
  let subFsm1: GmsSubscriptionFsm<ValueDetails>;
  let subFsm2: GmsSubscriptionFsm<ValueDetails>;
  let subFsm3: GmsSubscriptionFsm<ValueDetails>;
  let reply: GmsSubscriptionFsmReply<ValueDetails>;

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
    subShared = new GmsSubscriptionShared<ValueDetails>();

  }));

  // Tests for state 'Subscribing' ////////////////////////////////////////////////////////////////////////////////

  it('GmsSubscriptionShared<T>: Create initial subscription.',
    () => {
      reply = subShared.initialize(objectId1, trace, 'testModule', clientId1);

      expect(subShared.isActive).toBeTruthy('State must be \'active\' (Subscribing or Subsribed or ReSubscribePending)');
      expect(subShared.refCount).toBe(1, 'One value subscription existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subShared.gmsId).toBe(objectId1);
      expect(subShared.subscriptionWsi).toBeUndefined('WSI subscription must be still undefined.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(1, 'One value subscription must be existing.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.DoSubscribe, 'Expected reply type: doSubscribe');
      expect(subShared.gmsSubscriptionFsms.get(reply.subFsmCreated!.gmsSubscription.id)).toBe(reply.subFsmCreated);
      expect(reply.subFsmCreated!.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(reply.subFsmCreated!.gmsSubscription.clientId).toBe(clientId1, 'Expected client: clientId1');
      expect(reply.subFsmCreated!.gmsSubscription.errorCode).toBeUndefined('Expected errorcode: undefined');
      expect(reply.subFsmCreated!.gmsSubscription.connectionOK).toBeUndefined('Expected connectionState: undefined');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription to be removed');
      expect(reply.subFsmCreated!.gmsId).toBe(objectId1);
      expect(reply.subFsmCreated!.gmsSubscription.gmsId).toBe(objectId1);
      expect(reply.subFsmCreated!.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');

      trace.info('Test', 'Anymessage');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=subscribeReply(true)',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi);

      expect(subShared.isActive).toBeTruthy('State must be \'active\' (Subscribing or Subsribed or ReSubscribePending)');
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.subscriptionWsi).toBe(subWsi, 'WSI subscription must be defined.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(1, 'One value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.errorCode).toBe(0, 'Expected errorcode: 0');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.connectionOK).toBe(true, 'Expected connectionState: true');

      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=subscribeReply(false)',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      reply = subShared.subscribeReply(undefined);

      expect(subShared.isActive).toBeFalsy('State must be \'inactive\'');
      expect(subShared.refCount).toBe(0, 'No value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
      expect(subShared.subscriptionWsi).toBeUndefined('WSI subscription must be still undefined.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(0, 'No value subscription must be existing.');
      expect(subFsm.gmsSubscription.errorCode).toBeUndefined('Expected errorcode: undefined');
      expect(subFsm.gmsSubscription.connectionOK).toBe(false, 'Expected connectionState: undefined');

      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined();
      expect(reply.subFsmCreated).toBeUndefined();
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=subscribeReply(errorCode!=0)',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 1 };
      reply = subShared.subscribeReply(subWsi);

      expect(subShared.isActive).toBeFalsy('State must be \'inactive\'');
      expect(subShared.refCount).toBe(0, 'No value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
      expect(subShared.subscriptionWsi).toBe(subWsi, 'WSI subscription must be defined with errorCode=1');
      expect(subShared.subscriptionWsi!.errorCode).toBe(subWsi.errorCode, 'WSI subscription must be defined with errorCode=1');
      expect(subShared.gmsSubscriptionFsms.size).toBe(0, 'No value subscription must be existing.');
      expect(subFsm.gmsSubscription.errorCode).toBe(1, 'Expected errorcode: 1');
      expect(subFsm.gmsSubscription.connectionOK).toBe(true, 'Expected connectionState: true');

      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined();
      expect(reply.subFsmCreated).toBeUndefined();
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=subscribe()',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      reply = subShared.subscribe(clientId1)!;

      expect(subShared.isActive).toBeTruthy('State must be \'active\'');
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subShared.subscriptionWsi).toBeUndefined('WSI subscription must be still undefined.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(2, 'Two value subscription must be existing.');

      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(subShared.gmsSubscriptionFsms.get(reply.subFsmCreated!.gmsSubscription.id)).toBe(reply.subFsmCreated);
      expect(reply.subFsmCreated!.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(reply.subFsmCreated!.gmsSubscription.clientId).toBe(clientId1, 'Expected client: clientId1');
      expect(reply.subFsmCreated!.gmsSubscription.errorCode).toBeUndefined('Expected errorcode: undefined');
      expect(reply.subFsmCreated!.gmsSubscription.connectionOK).toBeUndefined('Expected connectionState: undefined');
      expect(reply.subFsmCreated!.gmsId).toBe(objectId1);
      expect(reply.subFsmCreated!.gmsSubscription.gmsId).toBe(objectId1);
      expect(reply.subFsmCreated!.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription to be removed');

      reply = subShared.subscribe(clientId2)!;
      expect(subShared.refCount).toBe(3, 'Three value subscription must be existing.');
      expect(reply.subFsmCreated!.gmsSubscription.clientId).toBe(clientId2, 'Expected client: clientId2');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=unsubscribe(), Late arrival of subscriptionReply(true)',
    () => {
      const sub1: GmsSubscription<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!.gmsSubscription;
      const sub2: GmsSubscription<ValueDetails> = subShared.subscribe(clientId1)!.subFsmCreated!.gmsSubscription;
      const sub3: GmsSubscription<ValueDetails> = subShared.subscribe(clientId2)!.subFsmCreated!.gmsSubscription;
      const sub4: GmsSubscription<ValueDetails> = subShared.subscribe(clientId3)!.subFsmCreated!.gmsSubscription;
      expect(subShared.refCount).toBe(4, 'Two value subscription must be existing.');

      reply = subShared.unsubscribe(sub4)!;
      expect(subShared.isActive).toBeTruthy('State must be \'active\'');
      expect(subShared.refCount).toBe(3, 'Three value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subShared.subscriptionWsi).toBeUndefined('WSI subscription must be still undefined.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(3, 'Three value subscription must be existing.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(subShared.gmsSubscriptionFsms.get(reply.subFsmRemoved!.gmsSubscription.id)).toBeUndefined('Must no more be in map.');
      expect(reply.subFsmRemoved!.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription to be created');

      reply = subShared.unsubscribe(sub1)!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subShared.gmsSubscriptionFsms.get(reply.subFsmRemoved!.gmsSubscription.id)).toBeUndefined('Must no more be in map.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved!.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');

      reply = subShared.unsubscribe(sub1)!; // Negative test case
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription to be created');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription to be removed');

      reply = subShared.unsubscribe(sub2)!;
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subShared.gmsSubscriptionFsms.get(reply.subFsmRemoved!.gmsSubscription.id)).toBeUndefined('Must no more be in map.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved!.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');

      reply = subShared.unsubscribe(sub3)!;
      expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing (still as there is no wsiKey available)');
      expect(subShared.gmsSubscriptionFsms.size).toBe(0, 'Zero value subscription must be existing.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: none');
      expect(reply.subFsmRemoved!.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
      expect(reply.subFsmRemoved!.gmsSubscription.clientId).toBe(clientId2, 'Expected client: clientId2');

      const subWsi: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi);
      expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Unsubscribing, 'Expected state: Unsubscribing (as there are no value subscriptions)');
      expect(reply.fsmReplyType).toBe(FsmReplyType.DoUnsubscribe, 'Expected reply type: doUnsubscribe');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription to be created');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription to be removed');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=unsubscribe(), intermediate arrival of subscriptionReply(true)',
    () => {
      const sub1: GmsSubscription<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!.gmsSubscription;
      const sub2: GmsSubscription<ValueDetails> = subShared.subscribe(clientId1)!.subFsmCreated!.gmsSubscription;
      const sub3: GmsSubscription<ValueDetails> = subShared.subscribe(clientId2)!.subFsmCreated!.gmsSubscription;
      const sub4: GmsSubscription<ValueDetails> = subShared.subscribe(clientId3)!.subFsmCreated!.gmsSubscription;
      expect(subShared.refCount).toBe(4, 'Two value subscription must be existing.');

      reply = subShared.unsubscribe(sub4)!;
      reply = subShared.unsubscribe(sub1)!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');

      const subWsi: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi);
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: none');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription to be created');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription to be removed');
      expect(sub2.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(sub3.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');

      const sub5: GmsSubscription<ValueDetails> = subShared.subscribe(clientId3)!.subFsmCreated!.gmsSubscription;
      expect(subShared.refCount).toBe(3, 'Three value subscription must be existing.');
      expect(sub5.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');

      reply = subShared.unsubscribe(sub2)!;
      reply = subShared.unsubscribe(sub3)!;
      reply = subShared.unsubscribe(sub5)!;
      expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Unsubscribing, 'Expected state: Unsubscribing (wsiKey available)');
      expect(subShared.gmsSubscriptionFsms.size).toBe(0, 'Zero value subscription must be existing.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.DoUnsubscribe, 'Expected reply type: doUnsubscribe');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription to be created');
      expect(reply.subFsmRemoved).toBeDefined('Value subscription to be removed');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=unsubscribeReply(true)',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 0 };
      subShared.unsubscribeReply(subDelWsi);

      // the event must not be handled
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=unsubscribeReply(false)',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 0 };
      subShared.unsubscribeReply(undefined);

      // the event must not be handled
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=unsubscribeReply(errorCode!=0)',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 1 };
      subShared.unsubscribeReply(undefined);

      // the event must not be handled
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=notifyChannelDisconnect()',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');

      subShared.notifyChannelDisconnected();
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribing, Input=notifyChannelReconnect()',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');

      subShared.notifyChannelReconnected();
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  // Tests for state 'Subscribed' ///////////////////////////////////////////////////////////////////////////////////

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=subscribeReply(true)',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');

      const subWsi2: SubscriptionGms = { key: 1, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi2);
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.subscriptionWsi).toBe(subWsi1, 'WSI subscription must be the initial.');
      expect(subShared.subscriptionWsi!.key).toBe(0, 'WSI subscriptionKey must be the initial.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(1, 'One value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.errorCode).toBe(0, 'Expected errorcode: 0');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.connectionOK).toBe(true, 'Expected connectionState: true');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=subscribeReply(errorCode!=0)',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');

      const subWsi2: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 1 };
      reply = subShared.subscribeReply(subWsi2);
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.subscriptionWsi).toBe(subWsi1, 'WSI subscription must be the initial.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(1, 'One value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.errorCode).toBe(0, 'Expected errorcode: 0');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.connectionOK).toBe(true, 'Expected connectionState: true');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=subscribeReply(false)',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');

      reply = subShared.subscribeReply(undefined);
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.subscriptionWsi).toBe(subWsi1, 'WSI subscription must be the initial.');
      expect(subShared.gmsSubscriptionFsms.size).toBe(1, 'One value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.errorCode).toBe(0, 'Expected errorcode: 0');
      expect(subShared.gmsSubscriptionFsms.values().next().value.gmsSubscription.connectionOK).toBe(true, 'Expected connectionState: true');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=subscribe()',
    () => {
      const subFsm: GmsSubscriptionFsm<ValueDetails> = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');

      reply = subShared.subscribe(clientId1)!;
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(reply.subFsmCreated!.gmsSubscription.clientId).toBe(clientId1, 'Expected client: clientId1');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
      expect(reply.subFsmCreated).toBeDefined('Value subscription being created');
      expect(reply.subFsmCreated!.gmsSubscription.errorCode).toBe(0, 'Expected errorcode: 0');
      expect(reply.subFsmCreated!.gmsSubscription.connectionOK).toBe(true, 'Expected connectionState: true');
      expect(reply.subFsmCreated!.gmsSubscription.propertyId).toBe(objectId1 + '.Prop', 'Expected propertyId: ' + objectId1 + '.Prop');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=unsubscribe()',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      subFsm3 = subShared.subscribe(clientId3)!.subFsmCreated!;
      expect(subShared.refCount).toBe(3, 'Three value subscription must be existing.');

      reply = subShared.unsubscribe(subFsm1.gmsSubscription)!;
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.has(reply.subFsmRemoved!.gmsSubscription.id)).toBe(false, 'Must no more be in map.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved!.gmsSubscription.clientId).toBe(clientId1, 'Expected client: clientId1');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');

      reply = subShared.unsubscribe(subFsm3.gmsSubscription)!;
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.has(reply.subFsmRemoved!.gmsSubscription.id)).toBe(false, 'Must no more be in map.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved!.gmsSubscription.clientId).toBe(clientId3, 'Expected client: clientId3');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');

      reply = subShared.unsubscribe(subFsm2.gmsSubscription)!;
      expect(subShared.state).toBe(SubscriptionState.Unsubscribing, 'Expected state: Unsubscribing');
      expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.has(reply.subFsmRemoved!.gmsSubscription.id)).toBe(false, 'Must no more be in map.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.DoUnsubscribe, 'Expected reply type: None');
      expect(reply.subFsmRemoved!.gmsSubscription.clientId).toBe(clientId2, 'Expected client: clientId2');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=unsubscribeReply(true)',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 0 };
      subShared.unsubscribeReply(subDelWsi);
      // the event must not be handled
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=unsubscribeReply(false)',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');

      subShared.unsubscribeReply(undefined);
      // the event must not be handled
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=unsubscribeReply(errorCode!=0)',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 1 };
      subShared.unsubscribeReply(subDelWsi);
      // the event must not be handled
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=notifyChannelDisconnect()',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');

      subShared.notifyChannelDisconnected();
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    }
  );

  it('GmsSubscriptionShared<T>: State=Subscribed, Input=notifyChannelReconnect()',
    () => {
      subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
      const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi1);
      subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');

      subShared.notifyChannelReconnected();
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  // Tests for state ResubscribedPending /////////////////////////////////////////////////////////////////////////////

  const initResubscribePendingState = (): void => {
    subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
    const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
    reply = subShared.subscribeReply(subWsi1);
    subFsm2 = subShared.subscribe(clientId2)!.subFsmCreated!;
    subShared.notifyChannelDisconnected();
    expect(subShared.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
  };

  const checkResubscribePendingNoChangeAllowed = (): void => {
    expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
    expect(subShared.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
    expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
    expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
  };

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=subscribeReply(true)',
    () => {
      initResubscribePendingState();
      const subWsi2: SubscriptionGms = { key: 1, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi2);
      checkResubscribePendingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=subscribeReply(errorCode!=0)',
    () => {
      initResubscribePendingState();
      const subWsi2: SubscriptionGms = { key: 1, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 1 };
      reply = subShared.subscribeReply(subWsi2);
      checkResubscribePendingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=subscribeReply(false)',
    () => {
      initResubscribePendingState();
      reply = subShared.subscribeReply(undefined);
      checkResubscribePendingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=subscribe()',
    () => {
      initResubscribePendingState();
      subFsm3 = subShared.subscribe(clientId3)!.subFsmCreated!;
      expect(subShared.refCount).toBe(3, 'Three value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
      expect(subFsm3.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');

    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=unsubscribe()',
    () => {
      initResubscribePendingState();

      reply = subShared.unsubscribe(subFsm1.gmsSubscription)!;
      expect(subShared.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
      expect(subShared.refCount).toBe(1, 'One value subscription must be existing.');
      expect(subShared.gmsSubscriptionFsms.has(reply.subFsmRemoved!.gmsSubscription.id)).toBe(false, 'Must no more be in map.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved!.gmsSubscription.clientId).toBe(clientId1, 'Expected client: clientId1');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');

      reply = subShared.unsubscribe(subFsm2.gmsSubscription)!;
      expect(subShared.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
      expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
      expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
      expect(reply.subFsmRemoved!.gmsSubscription.clientId).toBe(clientId2, 'Expected client: clientId2');
      expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=unsubscribeReply(true)',
    () => {
      initResubscribePendingState();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 0 };
      subShared.unsubscribeReply(subDelWsi);
      checkResubscribePendingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=unsubscribeReply(false)',
    () => {
      initResubscribePendingState();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 1 };
      subShared.unsubscribeReply(subDelWsi);
      checkResubscribePendingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=unsubscribeReply(errorCode!=0)',
    () => {
      initResubscribePendingState();
      subShared.unsubscribeReply(undefined);
      checkResubscribePendingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=notifyChannelDisconnect()',
    () => {
      initResubscribePendingState();
      subShared.notifyChannelDisconnected();
      checkResubscribePendingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=ResubscribePending, Input=notifyChannelReconnect()',
    () => {
      initResubscribePendingState();
      subShared.notifyChannelReconnected();
      expect(subShared.refCount).toBe(2, 'Two value subscription must be existing.');
      expect(subShared.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      expect(subFsm2.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  // Tests for state Unsubscribing //////////////////////////////////////////////////////////////////////////////////

  const initUnsubscribingState = (): void => {
    subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
    const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
    reply = subShared.subscribeReply(subWsi1);
    reply = subShared.unsubscribe(subFsm1.gmsSubscription)!;
    expect(subShared.state).toBe(SubscriptionState.Unsubscribing, 'Expected state: Unsubscribing');
    expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
  };

  const checkUnsubscribingNoChangeAllowed = (): void => {
    expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
    expect(subShared.state).toBe(SubscriptionState.Unsubscribing, 'Expected state: Unsubscribing');
    expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
  };

  const checkUnsubscribingNoChangeAllowedReply = (): void => {
    expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
    expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
    expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
  };

  const checkUnsubscribingToUnsubscribed = (): void => {
    expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
    expect(subShared.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
  };

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=subscribeReply(true)',
    () => {
      initUnsubscribingState();
      const subWsi2: SubscriptionGms = { key: 1, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi2);
      checkUnsubscribingNoChangeAllowed();
      checkUnsubscribingNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=subscribeReply(errorCode!=0)',
    () => {
      initUnsubscribingState();
      const subWsi2: SubscriptionGms = { key: 1, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 1 };
      reply = subShared.subscribeReply(subWsi2);
      checkUnsubscribingNoChangeAllowed();
      checkUnsubscribingNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=subscribeReply(false)',
    () => {
      initUnsubscribingState();
      reply = subShared.subscribeReply(undefined);
      checkUnsubscribingNoChangeAllowed();
      checkUnsubscribingNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=subscribe()',
    () => {
      initUnsubscribingState();
      reply = subShared.subscribe(clientId1)!;
      checkUnsubscribingNoChangeAllowed();
      checkUnsubscribingNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=unsubscribe()',
    () => {
      initUnsubscribingState();
      reply = subShared.unsubscribe(subFsm1.gmsSubscription)!;
      checkUnsubscribingNoChangeAllowed();
      checkUnsubscribingNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=unsubscribeReply(true)',
    () => {
      initUnsubscribingState();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 0 };
      subShared.unsubscribeReply(subDelWsi);
      checkUnsubscribingToUnsubscribed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=unsubscribeReply(false)',
    () => {
      initUnsubscribingState();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 1 };
      subShared.unsubscribeReply(subDelWsi);
      checkUnsubscribingToUnsubscribed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=unsubscribeReply(errorCode!=0)',
    () => {
      initUnsubscribingState();
      subShared.unsubscribeReply(undefined);
      checkUnsubscribingToUnsubscribed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=notifyChannelDisconnect()',
    () => {
      initUnsubscribingState();
      subShared.notifyChannelDisconnected();
      checkUnsubscribingNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribing, Input=notifyChannelReconnect()',
    () => {
      initUnsubscribingState();
      subShared.notifyChannelReconnected();
      checkUnsubscribingNoChangeAllowed();
    }
  );

  // Tests for state Unsubscribed ///////////////////////////////////////////////////////////////////////////////////

  const initUnsubscribedState = (): void => {
    subFsm1 = subShared.initialize(objectId1, trace, 'testModule', clientId1).subFsmCreated!;
    const subWsi1: SubscriptionGms = { key: 0, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
    reply = subShared.subscribeReply(subWsi1);
    reply = subShared.unsubscribe(subFsm1.gmsSubscription)!;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 0 };
    subShared.unsubscribeReply(subDelWsi);
    expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
    expect(subShared.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
  };

  const checkUnsubscribedNoChangeAllowed = (): void => {
    expect(subShared.refCount).toBe(0, 'Zero value subscription must be existing.');
    expect(subShared.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    expect(subFsm1.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
  };

  const checkUnsubscribedNoChangeAllowedReply = (): void => {
    expect(reply.fsmReplyType).toBe(FsmReplyType.None, 'Expected reply type: None');
    expect(reply.subFsmRemoved).toBeUndefined('No value subscription being removed');
    expect(reply.subFsmCreated).toBeUndefined('No value subscription being created');
  };

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=subscribeReply(true)',
    () => {
      initUnsubscribedState();
      const subWsi2: SubscriptionGms = { key: 1, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 0 };
      reply = subShared.subscribeReply(subWsi2);
      checkUnsubscribedNoChangeAllowed();
      checkUnsubscribedNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=subscribeReply(errorCode!=0)',
    () => {
      initUnsubscribedState();
      const subWsi2: SubscriptionGms = { key: 1, originalId: objectId1, propertyId: objectId1 + '.Prop', errorCode: 1 };
      reply = subShared.subscribeReply(subWsi2);
      checkUnsubscribedNoChangeAllowed();
      checkUnsubscribedNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=subscribeReply(false)',
    () => {
      initUnsubscribedState();
      reply = subShared.subscribeReply(undefined);
      checkUnsubscribedNoChangeAllowed();
      checkUnsubscribedNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=subscribe()',
    () => {
      initUnsubscribedState();
      reply = subShared.subscribe(clientId1)!;
      checkUnsubscribedNoChangeAllowed();
      checkUnsubscribedNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=unsubscribe()',
    () => {
      initUnsubscribedState();
      reply = subShared.unsubscribe(subFsm1.gmsSubscription)!;
      checkUnsubscribedNoChangeAllowed();
      checkUnsubscribedNoChangeAllowedReply();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=unsubscribeReply(true)',
    () => {
      initUnsubscribedState();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 0 };
      subShared.unsubscribeReply(subDelWsi);
      checkUnsubscribedNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=unsubscribeReply(false)',
    () => {
      initUnsubscribedState();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const subDelWsi: SubscriptionDeleteWsi = { Key: 0, ErrorCode: 1 };
      subShared.unsubscribeReply(subDelWsi);
      checkUnsubscribedNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=unsubscribeReply(errorCode!=0)',
    () => {
      initUnsubscribedState();
      subShared.unsubscribeReply(undefined);
      checkUnsubscribedNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=notifyChannelDisconnect()',
    () => {
      initUnsubscribedState();
      subShared.notifyChannelDisconnected();
      checkUnsubscribedNoChangeAllowed();
    }
  );

  it('GmsSubscriptionShared<T>: State=Unsubscribed, Input=notifyChannelReconnect()',
    () => {
      initUnsubscribedState();
      subShared.notifyChannelReconnected();
      checkUnsubscribedNoChangeAllowed();
    }
  );

});
