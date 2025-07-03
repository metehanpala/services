import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AppRights } from './data.model';

@Injectable({
  providedIn: 'root'
})
export abstract class AppRightsServiceProxyBase {

  /**
   * Gets all the application rights for the authenticated user.
   * See also WSI API specification.
   *
   * @returns An observable of array { AppRights } objects.
   *
   * @memberOf AppRightsServiceProxyBase
   */
  public abstract getAppRightsAll(): Observable<AppRights>;
}
