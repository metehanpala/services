import { Observable } from 'rxjs';

import { SystemInfo, SystemsResponseObject } from '../wsi-proxy-api/systems/data.model';

/**
 * Base class for a systems service.
 * See the WSI documentation for details.
 */
export abstract class SystemsServiceBase {

  /**
   * Gets all systems including languages installed and distributed/local system info.
   * See also WSI API specification.
   */
  public abstract getSystemsExt(): Observable<SystemsResponseObject>;

  /**
   * Gets all systems with languages installed
   * See also WSI API specification.
   *
   * @returns An observable with an array of { System } objects.
   */
  public abstract getSystems(): Observable<SystemInfo[]>;

  /**
   * Gets a specific system with languages installed
   * See also WSI API specification.
   * DesigoCC progect will use NUMBERs
   * IOT Project will use STRINGS
   * @param systemId
   * @returns An observable with a specific { System }.
   */
  public abstract getSystem(systemId: any): Observable<SystemInfo>;

  /**
   * Gets the local system with languages installed.
   *
   * @returns An observable with the local { System }.
   */
  public abstract getSystemLocal(): Observable<SystemInfo>;

  /**
   * Subscribes for changes of Systems Info.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SystemsServiceBase
   */
  public abstract subscribeSystems(): Observable<boolean>;

  /**
   * Unsubscribe for changes of Systems Info.
   *
   * @abstract
   * @returns {Observable<boolean>}
   *
   * @memberOf SystemsServiceBase
   */
  public abstract unSubscribeSystems(): Observable<boolean>;

  /**
   * Systems notifications.
   *
   * @abstract
   * @returns {Observable<EventSound>}
   *
   * @memberOf SystemsServiceBase
   */
  public abstract systemsNotification(): Observable<SystemInfo[]>;

  /**
   * Patches the System with the provided userDefinedName.
   * @param systemId
   * @returns An observable with the modified system details
   */
  public abstract setSystemPath?(systemId: string, value: string, csid?: string): Observable<any>;

  /**
   * gets the json with url.
   * @returns An observable with the url and expiry time in the form of json.
   */
  public abstract downloadCredentialsPack?(systemId: string): Observable<any>;

  /**
   * gets the zip file with the provided url.
   * @param url
   * @returns An observable with the zip file.
   */
  public abstract getCredentialsPack?(url: string): Observable<any>;
}
