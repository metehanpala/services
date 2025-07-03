import { Injectable } from '@angular/core';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { AppRightsServiceProxyBase } from '../wsi-proxy-api/app-rights/app-rights.services-proxy.base';
import { ApplicationRight, AppRights } from '../wsi-proxy-api/app-rights/data.model';
@Injectable({
  providedIn: 'root'
})
export class AppRightsService {

  private _appRightsAll: AppRights | undefined;

  public constructor(
    private readonly traceService: TraceService,
    private readonly appRightsServiceProxy: AppRightsServiceProxyBase) {
    this.traceService.info(TraceModules.appRights, 'Application rights service created.');
  }

  /**
   * Gets all the application rights for the authenticated user.
   * retrieved by AppRightsServiceProxy via WSI (or from local variable IF already retreived).
   *
   * @returns An observable of array { AppRights } objects.
   *
   * @memberOf AppRightsService
   */
  public getAppRightsAll(): Observable<AppRights | undefined> {
    this.traceService.debug(TraceModules.appRights, 'getAppRightsAll() called');
    if (isNullOrUndefined(this._appRightsAll)) {
      return this.appRightsServiceProxy.getAppRightsAll().pipe(
        map((appRights: AppRights) => this.setAppRights(appRights)));
    } else {
      return of(this._appRightsAll);
    }
  }

  /**
   * Gets the application rights for a specific ID.
   * retrieved by AppRightsServiceProxy via WSI.
   *
   * @returns An observable of array { AppRights } objects.
   *
   * @memberOf AppRightsService
   */
  public getAppRights(id: number): ApplicationRight | undefined | null {
    if (!isNullOrUndefined(this._appRightsAll) &&
     !isNullOrUndefined(this._appRightsAll?.ApplicationRights) && this._appRightsAll!.ApplicationRights.length > 0) {
      return this._appRightsAll?.ApplicationRights.find((value: ApplicationRight) => value.Id === id);
    } else {
      this.traceService.debug(TraceModules.appRights, 'getAppRights(Id) failed, returned null');
      return null;
    }
  }

  /**
   * sets the application rights in a local variable and return the saved value
   * retrieved by AppRightsServiceProxy via WSI.
   *
   * @returns An { AppRights } objects.
   *
   * @memberOf AppRightsService
   */
  private setAppRights(value: AppRights): AppRights {
    this._appRightsAll = value;
    return this._appRightsAll;
  }
}
