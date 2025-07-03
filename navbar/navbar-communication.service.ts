import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { CnsLabel } from '../cns/cns-helper.model';
/**
 * GMS navigation bar communication service.
 */
@Injectable({
  providedIn: 'root'
})
export class NavbarCommunicationService {

  private readonly statusBarState: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private readonly hldlConfig: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private readonly buzzerEnabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  private readonly cnsLabel: BehaviorSubject<CnsLabel> = new BehaviorSubject<CnsLabel>(new CnsLabel());

  /**
   * setStatusBarState and getStatusBarState methods together provide a bidirectional communication
   * between summary-bar and navigation-bar through a BehaviorSubject
   * to transfer status bar height information.
   */
  public setStatusBarState(state: any): Observable<boolean | null> {
    if (state) {
      this.statusBarState.next(state);
      return of(true);
    }
    return of(null);
  }

  public getStatusBarState(): Observable<any> {
    return this.statusBarState.asObservable();
  }

  /**
   * setHldlConfig and getHldlConfig methods together transfer the hldl information
   * from summary-bar to navigation-bar through a BehaviorSubject.
   */
  public setHldlConfig(config: any): Observable<boolean | null> {
    if (config) {
      this.hldlConfig.next(config);
      return of(true);
    }
    return of(null);
  }

  public getHldlConfig(): Observable<any> {
    return this.hldlConfig.asObservable();
  }

  public getBuzzerState(): Observable<boolean> {
    return this.buzzerEnabled.asObservable();
  }

  public setBuzzerState(buzzerEnabled: boolean): void {
    this.buzzerEnabled.next(buzzerEnabled);
  }

  public getCnsLabel(): Observable<CnsLabel> {
    return this.cnsLabel.asObservable();
  }

  public setCnsLabel(cnsLabel: CnsLabel): void {
    this.cnsLabel.next(cnsLabel);
  }

}
