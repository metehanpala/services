import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

import { OwnershipServiceBase, WsiOwner, WsiOwnership } from '../public-api';
import { OwnershipServiceProxy } from './ownership.service-proxy';

@Injectable({
  providedIn: 'root'
})
export class OwnershipService implements OwnershipServiceBase {

  private ownershipNotificationWSI: ReplaySubject<void > | null = null;
  private ownershipProxySubscription: Observable<boolean> | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly ownershipServiceProxy: OwnershipServiceProxy
  ) { }

  public fetchOwnership(): Observable<WsiOwner> {
    return this.ownershipServiceProxy.fetchOwnership();
  }

  public updateOwnership(owner: WsiOwnership): Observable<WsiOwnership> {
    return this.ownershipServiceProxy.updateOwnership(owner);
  }

  public subscribeOwnership(): Observable<boolean> {
    if (this.ownershipProxySubscription === null) {
      this.ownershipNotificationWSI = new ReplaySubject(null!);
      this.subscriptions.push(this.ownershipServiceProxy.ownershipNotification().subscribe(res => this.onOwnershipNotification(res)));

      this.ownershipProxySubscription = this.ownershipServiceProxy.subscribe('ownership');
    }

    return this.ownershipProxySubscription;
  }

  public unsubscribeOwnership(): Observable<boolean> {
    return this.ownershipServiceProxy.unsubscribeOwnership('ownership');
  }

  public ownershipNotification(): Observable<void> | any {
    return this.ownershipNotificationWSI?.asObservable();
  }

  private onOwnershipNotification(res: any): void {
    this.ownershipNotificationWSI?.next(res);
  }
}
