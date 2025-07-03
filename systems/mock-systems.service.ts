import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { SystemInfo, SystemsResponseObject } from '../wsi-proxy-api/systems/data.model';
import { SystemsServiceBase } from './systems.service.base';

/**
 * Mock of SystemsService
 * @extends SystemsServiceBase
 */

@Injectable({
  providedIn: 'root'
})
export class MockSystemsService implements SystemsServiceBase {

  /* eslint-disable @typescript-eslint/naming-convention */

  private readonly sro: SystemsResponseObject =
    {
      'Systems': [
        {
          'Name': 'System1',
          'Id': 1,
          'IsOnline': true,
          'Description': 'System1'
        },
        {
          'Name': 'System2',
          'Id': 2,
          'IsOnline': false,
          'Description': 'System2'
        }
      ],
      'Languages': [
        {
          'ArrayIndex': 0,
          'Descriptor': 'English (United States)',
          'Code': 'en-US'
        },
        {
          'ArrayIndex': 1,
          'Descriptor': 'French (Canada)',
          'Code': 'fr-CA'
        }
      ],
      'IsDistributed': true,
      'IdLocal': 1
    };

  /* eslint-enable @typescript-eslint/naming-convention */

  /**
   * @returns An observable with a full SystemsResponseObject object.
   *
   * @member MockSystemsService
   */
  public getSystemsExt(): Observable<SystemsResponseObject> {
    return of(this.sro);
  }

  /**
   * @returns An observable with an array of {System } objects.
   *
   * @member MockSystemsService
   */
  public getSystems(): Observable<SystemInfo[]> {
    return of(this.sro.Systems);
  }

  /**
   * @returns An observable with a specific {System } object.
   *
   * @member MockSystemsService
   */
  public getSystem(systemId: any): Observable<SystemInfo> {
    return of(this.sro.Systems[0]);
  }

  /**
   * @returns An observable with the local {System } object.
   *
   * @member MockSystemsService
   */
  public getSystemLocal(): Observable<SystemInfo> {
    return of(this.sro.Systems[0]);
  }

  /**
   * @returns An observable with a specific {System } object.
   *
   * @member MockSystemsService
   */
  public setSystemPath(systemId: string, value: string): Observable<any> {
    return of(this.sro.Systems);
  }

  public subscribeSystems(): Observable<boolean> {
    return of(true);
  }

  public unSubscribeSystems(): Observable<boolean> {
    return of(true);
  }

  public systemsNotification(): Observable<SystemInfo[]> {
    return of(this.sro.Systems);
  }

  /**
   * @returns An observable with a specific {System } object.
   *
   * @member MockSystemsService
   */
  public downloadCredentialsPack(systemId: string): Observable<any> {
    throw new Error('Method not implemented.');
  }

  /**
   * @returns An observable with a specific { } object.
   *
   * @member MockSystemsService
   */
  public getCredentialsPack(url: string): Observable<any> {
    throw new Error('Method not implemented.');
  }
}
