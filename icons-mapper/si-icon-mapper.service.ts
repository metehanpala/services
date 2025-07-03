import { HttpClient, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { defaultIcon, TablesData, TablesEx } from './data.model';

const noMatch = 'No matching entry for table:%s, iconId:%s! Returning default icon:%s';
const moduleName = 'gmsServices_Utilities:';

/* eslint-disable no-console, no-restricted-syntax */

/**
 * Implementation for the SiIconMapper service.
 * See the WSI documentation for details.
 *
 * @export
 * @class SiIconMapperService
 */
@Injectable({
  providedIn: 'root'
})
export class SiIconMapperService {

  protected tablesData: TablesData | undefined;

  private readonly _tablesDataFilePath: string;
  private readonly disciplines = 'disciplines';
  private readonly subDisciplines = 'subdisciplines';
  private readonly objectTypes = 'objecttypes';
  private readonly objectSubTypes = 'subtypes';

  public constructor(protected httpClient: HttpClient, @Inject('tablesDataPath') tablesDataFilePath: string) {
    this._tablesDataFilePath = tablesDataFilePath;
    console.info('gmsServices_Utilities: SiIconMapperService created. tablesDataPath: %s', this._tablesDataFilePath);
  }
  /**
   * This method reads the text-groups-and-icons.json file from gms-application.
   * It is used with provideAppInitializer.
   * Do NOT use it in the snapins.
   *
   * @returns {Observable<TablesData>}
   *
   * @memberOf SiIconMapperService
   */
  public getTablesData(): Observable<TablesData> {
    if (this.tablesData != null) {
      console.info('gmsServices_Utilities: SiIconMapperService.getTablesData() text-groups-and-icons.json already read, returning saved values.');
      return of(this.tablesData);
    } else {
      console.info('gmsServices_Utilities: SiIconMapperService.getTablesData() reading text-groups-and-icons.json file.');
      return this.httpClient.get(this._tablesDataFilePath, { observe: 'response' }).pipe(
        map((response: HttpResponse<any>) => this.extractData(response)),
        catchError((response: HttpResponse<any>) => this.handleError(response)));
    }
  }

  /**
   * This method is used to query for the icons.
   * It should be used in the snapins to retrieve the icon name
   * as an observable basing on the parameters passed.
   *
   * @param {TablesEx} table table name to query
   * @param {number} index Index number of the table.
   * @param {number} [parentIndex] Optional parameter for parent index number (e.g. index for subTypes => parentIndex for objectTypes)
   *
   * @returns {Observable<string>}
   *
   * @memberOf SiIconMapperService
   */
  public getGlobalIcon(table: TablesEx, index: number, parentIndex?: number): Observable<string> {
    if (this.tablesData === null) {
      console.warn('gmsServices_Utilities: No valid data available! Returning default icon:%s ', defaultIcon);
      return of(defaultIcon);
    }
    let tableId: SiIconMapperService['disciplines'] | SiIconMapperService['subDisciplines'] |
    SiIconMapperService['objectTypes'] | SiIconMapperService['objectSubTypes'];
    switch (table) {
      case TablesEx.Disciplines:
        tableId = this.disciplines;
        break;
      case TablesEx.SubDisciplines:
        tableId = this.subDisciplines;
        break;
      case TablesEx.ObjectTypes:
        tableId = this.objectTypes;
        break;
      case TablesEx.ObjectSubTypes:
        tableId = this.objectSubTypes;
        break;
      default:
        console.debug('gmsServices_Utilities: No valid table name:%s ! Returning default icon:%s', tableId!, defaultIcon);
        return of(defaultIcon);
    }
    const tableElement: any = this.tablesData![tableId].find((element: any) => element.id === index);
    if (!isNullOrUndefined(tableElement)) {
      return of(tableElement.icon);
    } else {
      if (tableId !== this.objectSubTypes) {
        console.warn(moduleName + noMatch, tableId, index, defaultIcon);
        return of(defaultIcon);
      } else {
        if (!parentIndex) {
          console.warn(moduleName + noMatch, tableId, index, defaultIcon);
          return of(defaultIcon);
        } else {
          const parentElement: any = this.tablesData![this.objectTypes].find(element => element.id === parentIndex);
          if (isNullOrUndefined(parentElement)) {
            console.warn(moduleName + noMatch, tableId, index, defaultIcon);
            return of(defaultIcon);
          } else {
            console.debug('gmsServices_Utilities: No matching entry for table:%s, iconId:%s! Returning %s icon:%s with id:%s',
              tableId, index, this.objectTypes, parentElement.icon, parentIndex);
            return of(parentElement.icon);
          }
        }
      }
    }
  }

  /**
   * This method is used to query for the icons.
   * It should be used in the snapins to retrieve the icon name
   * as a string basing on the parameters passed.
   *
   * @param {TablesEx} table table name to query
   * @param {number} index Index number of the table.
   * @param {number} [parentIndex] Optional parameter for parent index number (e.g. index for subTypes => parentIndex for objectTypes)
   *
   * @returns {string}
   *
   * @memberOf SiIconMapperService
   */
  public getGlobalIconSync(table: TablesEx, index: number, parentIndex?: number): string {
    if (this.tablesData === null) {
      console.warn('gmsServices_Utilities: No valid data available! Returning default icon:%s ', defaultIcon);
      return defaultIcon;
    }
    let tableId: SiIconMapperService['disciplines'] | SiIconMapperService['subDisciplines'] |
    SiIconMapperService['objectTypes'] | SiIconMapperService['objectSubTypes'];
    switch (table) {
      case TablesEx.Disciplines:
        tableId = this.disciplines;
        break;
      case TablesEx.SubDisciplines:
        tableId = this.subDisciplines;
        break;
      case TablesEx.ObjectTypes:
        tableId = this.objectTypes;
        break;
      case TablesEx.ObjectSubTypes:
        tableId = this.objectSubTypes;
        break;
      default:
        console.debug('gmsServices_Utilities: No valid table name:%s ! Returning default icon:%s', tableId!, defaultIcon);
        return defaultIcon;
    }
    const tableElement: any = this.tablesData![tableId].find((element: any) => element.id === index);
    if (!isNullOrUndefined(tableElement)) {
      return tableElement.icon;
    } else {
      if (tableId !== this.objectSubTypes) {
        console.warn(moduleName + noMatch, tableId, index, defaultIcon);
        return defaultIcon;
      } else {
        if (!parentIndex) {
          console.warn(moduleName + noMatch, tableId, index, defaultIcon);
          return defaultIcon;
        } else {
          const parentElement: any = this.tablesData![this.objectTypes].find(element => element.id === parentIndex);
          if (isNullOrUndefined(parentElement)) {
            console.warn(moduleName + noMatch, tableId, index, defaultIcon);
            return defaultIcon;
          } else {
            console.debug('gmsServices_Utilities: No matching entry for table:%s, iconId:%s! Returning %s icon:%s with id:%s',
              tableId, index, this.objectTypes, parentElement.icon, parentIndex);
            return parentElement.icon;
          }
        }
      }
    }
  }

  private extractData(res: HttpResponse<any>): TablesData {
    const body: any = res.body;
    this.tablesData = body;
    console.info('gmsServices_Utilities: SiIconMapperService text-groups-and-icons.json has been read.');
    return body;
  }

  private handleError(error: HttpResponse<any> | any): Observable<any> {
    try {
      console.error('gmsServices_Utilities: handleError(): Reading text-groups-and-icons.json file failed: %s', error.toString());
      return observableThrowError(error.toString());
    } catch (exc: any) {
      const endpointError = 'text-groups-and-icons.json file reading reply error! See trace.';
      console.error('gmsServices_Utilities: Exception caught: %s', exc.toString());
      return observableThrowError(endpointError);
    }
  }

}

/* eslint-enable no-console, no-restricted-syntax */
