import { Injectable } from '@angular/core';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { LicencseOptions } from '../wsi-proxy-api/license/data.model';
import { LicenseOptionsProxyServiceBase } from '../wsi-proxy-api/license/license-options.services-proxy.base';
@Injectable({
  providedIn: 'root'
})
export class LicenseOptionsService {

  private _licenseOptionsRightsAll: LicencseOptions[] | undefined;

  public constructor(
    private readonly traceService: TraceService,
    private readonly licenseOptionsProxyServiceBase: LicenseOptionsProxyServiceBase) {
    this.traceService.info(TraceModules.license, 'License oprtions service created.');
  }

  /**
   * Gets all the licens-options for the authenticated user.
   * retrieved by LicenseOptionServiceProxy via WSI (or from local variable IF already retreived).
   *
   * @returns An observable of array { LicenseOptions[] } array.
   *
   * @memberOf LicenseOptionService
   */
  public getLicenseOptionsRightsAll(): Observable<LicencseOptions[] | undefined> {
    this.traceService.debug(TraceModules.license, 'getLicenseOptionsRightsAll() called');
    if (isNullOrUndefined(this._licenseOptionsRightsAll)) {
      return this.licenseOptionsProxyServiceBase.getLicenseOptionsRightsAll().pipe(
        map((licenseOptionsRights: LicencseOptions[]) => this.setAppLicense(licenseOptionsRights)));
    } else {
      return of(this._licenseOptionsRightsAll);
    }
  }

  /**
   * Gets the licens-options for a specific ID.
   * retrieved by LicenseOptionServiceProxy via WSI.
   *
   * @returns An observable of array { LicenseOptions[] } array.
   *
   * @memberOf LicenseOptionService
   */
  public getLicenseOptionsRights(id: string | any): LicencseOptions | undefined | null {
    if (!isNullOrUndefined(this._licenseOptionsRightsAll) && this._licenseOptionsRightsAll!.length > 0) {
      return this._licenseOptionsRightsAll?.find((value: LicencseOptions) => value.Id === id);
    } else {
      this.traceService.debug(TraceModules.license, 'getLicenseOptionsRights(Id) failed, returned null');
      return null;
    }
  }

  /**
   * sets the licens-options in a local variable and return the saved value
   * retrieved by LicenseOptionServiceProxy via WSI.
   *
   * @returns An { LicenseOptions[] } array.
   *
   * @memberOf LicenseOptionService
   */
  private setAppLicense(value: LicencseOptions[]): LicencseOptions[] {
    this._licenseOptionsRightsAll = value;
    return this._licenseOptionsRightsAll;
  }
}
