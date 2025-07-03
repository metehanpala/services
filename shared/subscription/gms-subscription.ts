import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { SubscriptionUtility } from './subscription-utility';

export enum SubscriptionState {
  Subscribing = 0,
  Subscribed = 1,
  ResubscribePending = 2,
  Unsubscribing = 3,
  Unsubscribed = 4
}

export class GmsSubscription<T> {
  private static counter = 0;
  private _state: SubscriptionState = SubscriptionState.Subscribing;
  private readonly _stateChanged: BehaviorSubject<SubscriptionState>;
  private readonly _id: number;
  private readonly _notifyChange: ReplaySubject<T> = new ReplaySubject<T>(1);

  /**
   * Creates an instance of GmsSubscription.
   * @param {string} gmsId The required GMS Id to subscribe for; Set/requested by the client.
   * E.g. The objectId or propertyId in case of value change subscriptions;
   * Or the property ID for command change subscriptions
   * @param {string} clientId The Id of the client which requested the subscription.
   * @param {SubscriptionState} [state=SubscriptionState.Subscribing] The subscription state
   * @param {number} [errorCode] The error code of the subscription: 0 for good; any other value for bad.
   * @param {boolean} [connectionOK] False, in case the HTTP subscribe request failed.
   * @param {string} [propertyId] The effective subscribed/addressed propertyId (System:Object.Property);
   * This ID is invariant; it is the same no matter if a function property or model property or designation property has been subscribed for.
   * However, note that this Id is not!! set as long as the (underlying) shared subscription is in state Subscribing.
   * @memberof GmsSubscription
   */
  constructor(public gmsId: string, public clientId: string, state: SubscriptionState = SubscriptionState.Subscribing,
    public errorCode?: number, public connectionOK?: boolean, public propertyId?: string) {
    this._id = GmsSubscription.counter;
    GmsSubscription.counter++;
    this._state = state;
    this._stateChanged = new BehaviorSubject<SubscriptionState>(this._state);
  }

  /**
   * A unique id of the subscription;
   * Important, this is used to identify the GmsSubscription, when handed over in the unsubscribe method.
   *
   * @readonly
   * @type {number}
   * @memberof GmsSubscription
   */
  public get id(): number {
    return this._id;
  }

  /**
   * The state of the supscription.
   * Possible states: 'Subscribing', 'Subscribed', 'ResubscribePending' and 'Unsubscribed'
   *
   * @memberof GmsSubscription
   */
  public set state(value: SubscriptionState) {
    if (value !== this._state) {
      this._state = value;
      this._stateChanged.next(this._state);
    }
  }

  /**
   * The state of the subscription.
   * Possible states: 'Subscribing', 'Subscribed', 'ResubscribePending' and 'Unsubscribed'
   *
   * @type {SubscriptionState}
   * @memberof GmsSubscription
   */
  public get state(): SubscriptionState {
    return this._state;
  }

  /**
   * Event/Obserable (of type BehaviorSubject) for the state of the subscription.
   * Subscribing to it will immediately return current state and all further changes.
   * Possible states: 'Subscribing', 'Subscribed', 'ResubscribePending' and 'Unsubscribed'
   *
   * @readonly
   * @type {Observable<SubscriptionState>}
   * @memberof GmsSubscription
   */
  public get stateChanged(): Observable<SubscriptionState> {
    return this._stateChanged.asObservable();
  }

  /**
   * Event/Obserable (of type ReplaySubject) for the notifications of the subscription.
   * Subscribing to it will immediately return the latest value in history (if available) and all further changes.
   *
   * @readonly
   * @type {Observable<T>}
   * @memberof GmsSubscription
   */
  public get changed(): Observable<T> {
    return this._notifyChange.asObservable();
  }

  /**
   * Used for tracing
   *
   * @returns {string}
   * @memberof GmsSubscription
   */
  public toString(): string {
    return `gmsId: ${this.gmsId},
      state: ${SubscriptionUtility.getText(this.state)}, wsiErrorCode: ${this.errorCode},
      connectionOk: ${this.connectionOK}, id:  ${this.id},
      clientId:  ${this.clientId}`;
  }

  /**
   * Sets a new value (to be notified) for this object. Used by the corresponding subscription service.
   * Not to be used by the consumer!!!
   *
   * @param {T} value
   * @memberof GmsSubscription
   */
  public notifyChange(value: T): void {
    this._notifyChange.next(value);
  }
}
