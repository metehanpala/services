import { Type } from '@angular/core';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { PropertyCommand } from '../../wsi-proxy-api/command/data.model';
import { ValueDetails } from '../../wsi-proxy-api/shared/data.model';
import { SubscriptionState } from './gms-subscription';
import { GmsSubscriptionFsm } from './gms-subscription-fsm';

// Tests  /////////////
describe('GmsSubscriptionFsm<T>', () => {

  let trace: TraceService;

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

  }));

  it('GmsSubscriptionFsm<PropertyCommand>: Create subscription.',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      const fsm2: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId2', 'clientId');
      expect(fsm.id).toBe(fsm2.id - 1, 'Expected id incremented by 1');
    }
  );

  it('GmsSubscriptionFsm<ValueDetails>: Create subscription.',
    () => {
      const fsm: GmsSubscriptionFsm<ValueDetails> = new GmsSubscriptionFsm<ValueDetails>('objectId1', 'clientId');
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
      const fsm2: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId2', 'clientId');
      expect(fsm.id).toBe(fsm2.id - 1, 'Expected id incremented by 1');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribing, Input=subscribeReply(true)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionFsm<ValueDetails>: State=Subscribing, Input=subscribeReply(true)',
    () => {
      const fsm: GmsSubscriptionFsm<ValueDetails> = new GmsSubscriptionFsm<ValueDetails>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribing, Input=subscribeReply(false)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(false);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribing, Input=unsubscribe()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.unsubscribe();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribing, Input=notifyChannelDisconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.notifyChannelDisconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribing, Input=notifyChannelReconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.notifyChannelReconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribed, Input=subscribeReply(true)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.subscribeReply(true);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribed, Input=subscribeReply(false)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.subscribeReply(false);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribed, Input=unsubscribe()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.unsubscribe();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribed, Input=notifyChannelDisconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.notifyChannelDisconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Subscribed, Input=notifyChannelReconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.notifyChannelReconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribed, 'Expected state: Subscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=ResubscribePending, Input=subscribeReply(true)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.notifyChannelDisconnected();
      // we are now in state ResubscribePending
      fsm.subscribeReply(true);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=ResubscribePending, Input=subscribeReply(false)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.notifyChannelDisconnected();
      // we are now in state ResubscribePending
      fsm.subscribeReply(false);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=ResubscribePending, Input=unsubscribe()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.notifyChannelDisconnected();
      // we are now in state ResubscribePending
      fsm.unsubscribe();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=ResubscribePending, Input=notifyChannelDisconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.notifyChannelDisconnected();
      // we are now in state ResubscribePending
      fsm.notifyChannelDisconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.ResubscribePending, 'Expected state: ResubscribePending');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=ResubscribePending, Input=notifyChannelReconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(true);
      fsm.notifyChannelDisconnected();
      // we are now in state ResubscribePending
      fsm.notifyChannelReconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Subscribing, 'Expected state: Subscribing');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Unsubscribed, Input=subscribeReply(true)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(false);
      fsm.subscribeReply(true);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Unsubscribed, Input=subscribeReply(false)',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(false);
      fsm.subscribeReply(false);
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Unsubscribed, Input=unsubscribe()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(false);
      fsm.unsubscribe();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Unsubscribed, Input=notifyChannelDisconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(false);
      fsm.notifyChannelDisconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  it('GmsSubscriptionFsm<PropertyCommand>: State=Unsubscribed, Input=notifyChannelReconnected()',
    () => {
      const fsm: GmsSubscriptionFsm<PropertyCommand> = new GmsSubscriptionFsm<PropertyCommand>('objectId1', 'clientId');
      fsm.subscribeReply(false);
      fsm.notifyChannelReconnected();
      expect(fsm.gmsSubscription.state).toBe(SubscriptionState.Unsubscribed, 'Expected state: Unsubscribed');
    }
  );

  const getValue = (val: string): ValueDetails => {
    /* eslint-disable @typescript-eslint/naming-convention */
    return {
      DataType: '',
      ErrorCode: 0,
      SubscriptionKey: 0,
      Value: { Value: val, DisplayValue: '1', Timestamp: '', QualityGood: true, Quality: '' },
      IsArray: false
    };
    /* eslint-enable @typescript-eslint/naming-convention */
  };

  it('ValueSubscription: Check value notification',
    (done: DoneFn) => {
      const fsm: GmsSubscriptionFsm<ValueDetails> = new GmsSubscriptionFsm<ValueDetails>('objectId1', 'clientId');
      fsm.gmsSubscription.notifyChange(getValue('1'));
      fsm.gmsSubscription.notifyChange(getValue('2'));

      fsm.gmsSubscription.changed.subscribe(val => {
        expect(Number(val.Value.Value)).toBeGreaterThanOrEqual(2);
      });

      fsm.gmsSubscription.notifyChange(getValue('3'));
      fsm.gmsSubscription.notifyChange(getValue('4'));

      fsm.gmsSubscription.changed.subscribe(val => {
        expect(Number(val.Value.Value)).toBeGreaterThanOrEqual(4);
      });

      fsm.gmsSubscription.notifyChange(getValue('5'));
      fsm.gmsSubscription.notifyChange(getValue('6'));
      done();
    }
  );

});
