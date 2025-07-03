import { Injectable } from '@angular/core';
import { ErrorDisplayItem, ErrorDisplayState, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';

/**
 * GMS error notification service.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorNotificationService extends ErrorNotificationServiceBase {

  private readonly _errorsById: Map<number, ErrorDisplayItem> = new Map<number, ErrorDisplayItem>();
  private readonly _errorsSubjectsById: Map<number, Subject<ErrorDisplayItem>> = new Map<number, Subject<ErrorDisplayItem>>();
  private readonly _errorsSubsriptionsById: Map<number, Subscription> = new Map<number, Subscription>();

  private readonly _errorNotification: Subject<ErrorDisplayItem> = new Subject<ErrorDisplayItem>();

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   */
  public constructor(private readonly traceService: TraceService) {
    super();
    this.traceService.info(TraceModules.utilities, 'Error notification service created.');
  }

  public get errorChanged(): Observable<ErrorDisplayItem> {
    return this._errorNotification.asObservable();
  }

  public get errors(): ErrorDisplayItem[] {
    return Array.from(this._errorsById.values());
  }

  public notifyErrorChange(error: ErrorDisplayItem): void {
    this.traceService.info(TraceModules.utilities, 'ErrorNotificationService:notifyErrorChange() called:\nId=%s; State=%s; DebounceTime=%s',
      error.id, error.state, error.debounceTime);
    if ((error.state === ErrorDisplayState.Active) || (error.state === ErrorDisplayState.Inactive)) {
      if (this._errorsById.has(error.id) === false) {
        this._errorsById.set(error.id, error);
        this._errorsSubjectsById.set(error.id, new Subject<ErrorDisplayItem>());
        if (error.debounceTime != undefined) {
          this._errorsSubsriptionsById.set(error.id, this._errorsSubjectsById.get(error.id)!.pipe(debounceTime(error.debounceTime)).subscribe(
            (errorItem: any) => this.onErrorDisplayItemChanged(errorItem)));
        } else {
          this._errorsSubsriptionsById.set(error.id, this._errorsSubjectsById.get(error.id)!.subscribe(
            (errorItem: any) => this.onErrorDisplayItemChanged(errorItem)));
        }
      }
      this._errorsSubjectsById.get(error.id)?.next(error);
    } else {
      if (this._errorsById.has(error.id)) {
        this._errorsSubjectsById.get(error.id)?.next(error);
      } else {
        this.traceService.error(TraceModules.utilities, 'ErrorId not existing!');
      }
    }
  }

  private onErrorDisplayItemChanged(error: ErrorDisplayItem): void {
    this.traceService.info(TraceModules.utilities, 'ErrorNotificationService:onErrorDisplayItemChanged() called:\nId=%s; State=%s; DebounceTime=%s',
      error.id, error.state, error.debounceTime);
    this._errorNotification.next(error);
    if (error.state === ErrorDisplayState.Deleted) {
      this._errorsById.delete(error.id);
      this._errorsSubjectsById.delete(error.id);
      this._errorsSubsriptionsById.get(error.id)?.unsubscribe();
      this._errorsSubsriptionsById.delete(error.id);
    }
  }
}
