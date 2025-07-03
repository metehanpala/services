import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { interval, Observable } from 'rxjs';
import { share } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { TimerServiceBase } from './timer.service.base';

/**
 * Implementation for the WSI tables service.
 * See the WSI documentation for details.
 *
 * @export
 * @class TablesService
 * @extends {TablesBase}
 */
@Injectable({
  providedIn: 'root'
})
export class TimerService extends TimerServiceBase {

  private observables: any = {};

  public constructor(
    private readonly traceService: TraceService) {
    super();
    this.traceService.debug(TraceModules.timer, 'Service created.');
  }

  public getTimer(_interval: number): Observable<number> {
    if (this.observables[_interval]) {
      return this.observables[_interval];
    }
    const observable: Observable<number> = interval(_interval).pipe(share());
    this.observables[_interval] = observable;
    return observable;
  }
}
