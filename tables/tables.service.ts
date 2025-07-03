import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import {
  DisciplineWithSubgroup,
  EventColors,
  IconImage,
  LocalTextGroupEntry,
  ObjectTypeWithSubgroup,
  SubTables,
  Tables,
  TextEntry } from '../wsi-proxy-api/tables/data.model';
import { TablesServiceBase } from '../wsi-proxy-api/tables/tables.service.base';

const tablesUrl = '/api/tables/';

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
export class TablesService extends TablesServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.debug(TraceModules.tables, 'Service created.');
  }

  /**
   * Gets the sepecified table from WSI.
   * See WSI documentation for more details.
   *
   * @param {Tables } table Supported tables are: 'categories', 'disciplines', 'objecttypes', 'units', 'timefilter'
   * @returns {Observable<Map<number, string>>}
   *
   * @memberOf TablesService
   */
  public getTable(table: Tables): Observable<Map<number, string>> {
    this.traceService.info(TraceModules.tables, 'getTable() called, table name: %s', table);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + tablesUrl;
    url = url + table;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractDataTables(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.tables, 'getTable()', this.errorService)));
  }

  /**
   * Gets the specified table with its subgroups from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {Tables } table Supported tables are: 'disciplines', 'objecttypes'
   * @returns {Observable<Map<number, string>>}
   *
   * @memberOf TablesBase
   */
  public getTableWithSubgroup(table: Tables): Observable<DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[]> {
    this.traceService.info(TraceModules.tables, 'getTableWithSubgroup() called, table name: %s', table);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + tablesUrl;
    url = url + table + '/subgroups';

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractTableWithSubgroup(response)!),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(
        response, TraceModules.tables, 'getTableWithSubgroup()', this.errorService)));
  }

  /**
   * Gets the specifed subtable from WSI.
   * See WSI documentation for more details.
   *
   * @param {Tables } table
   * @param {SubTables } subTable
   * @returns {Observable<Map<number, Map<EventColors, string>>>}
   *
   * @memberOf TablesService
   */
  public getSubTable(table: Tables, subTable: SubTables): Observable<Map<number, Map<EventColors, string>>> {
    this.traceService.info(TraceModules.tables, 'getSubTable() called, table: %s, subTable : %s', table, subTable);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + tablesUrl;
    url = url + table + '/subtables/' + subTable;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractDataSubTables(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.tables, 'getSubTable()', this.errorService)));
  }

  public getGlobalIcon(table: Tables, index: number): Observable<string> {
    this.traceService.info(TraceModules.tables, 'getGlobalIcon() called, table: %s, index: %s', table, index);
    if ((table === Tables.Categories) || (table === Tables.Units)) { return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError()); }

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + tablesUrl;
    url = url + 'global/' + table + '/icons/' + index;
    let params: HttpParams = new HttpParams();
    params = params.set('format', 'PNG');

    return this.httpClient.get(url, { headers, params, responseType: 'text' }).pipe(
      map((response: string) => this.extractDataGlobalIcon(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.tables, 'getGlobalIcon()', this.errorService)));
  }

  public getGlobalIconExt(table: Tables, index: number, format?: string): Observable<any> {
    this.traceService.info(TraceModules.tables, 'getGlobalIconExt() called, table: %s, index: %s, format=%s', table, index, format);
    if ((table === Tables.Categories) || (table === Tables.Units)) { return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError()); }

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + tablesUrl;
    url = url + 'global/' + table + '/icons/' + index;
    let params: HttpParams = new HttpParams();
    if (format) {
      params = params.set('format', format);
    }

    return this.httpClient.get(url, { headers, params, observe: 'response', responseType: 'text' }).pipe(
      map((response: HttpResponse<string>) => this.extractDataGlobalIconExt(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.tables, 'getGlobalIconExt()', this.errorService)));
  }

  /**
   * Get the text for the specified system-global table.
   *
   * @param {Tables } table One of a set of well-known global tables: 'disciplines', 'subdisciplines', 'objecttypes', 'objectsubtypes', 'categories'
   * @param includeSubText Flag indicating if sub-text (subgroup) should be included in response.
   * @returns {TextEntry[] } Array of text entries for the specified table.
   */
  public getGlobalText(table: Tables, includeSubText: boolean): Observable<TextEntry[]> {
    this.traceService.info(TraceModules.tables, 'getGlobalText() called, table: %s, includeSubText: %s', table, includeSubText);
    if (!((table === Tables.ObjectTypes) || (table === Tables.Disciplines) ||
      (table === Tables.ObjectSubTypes) || (table === Tables.SubDisciplines) ||
      (table === Tables.Categories))) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    // Construct WSI api request
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + tablesUrl + 'global/' + table;
    if (includeSubText) {
      url = url + '/nestedText';
    } else {
      url = url + '/text';
    }

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractGlobalText(response)!),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.tables, 'getGlobalText()', this.errorService)));
  }

  public getIconForTextGroupEntry(systemId: string, tableName: string, index: string): Observable<string> {

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + tablesUrl + 'local/' + systemId + '/' + tableName + '/icons/' + index;
    return this.httpClient.get(url, { headers, responseType: 'text' }).pipe(
      map((response: string) =>
        this.extractIconForTextGroupEntry(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.tables, 'getIconForTextGroupEntry()', this.errorService)));

  }

  public getTextAndColorForTextGroupEntry(systemId: string, tableName: string, index: string): Observable<LocalTextGroupEntry> {

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + tablesUrl + 'local/' + systemId + '/' + tableName + '/text/' + index;
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.graphics, 'getTextandColorForTextGroupEntry()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.tables, 'getTextForTextGroupEntry()', this.errorService)));
  }

  public getTextAndColorForTextGroupEntries(systemId: string, textGroupName: string): Observable<LocalTextGroupEntry[]> {
    this.traceService.info(TraceModules.tables, 'getTextAndColorForTextGroupEntries() called for: ' + textGroupName);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const textGroupNameDoubleEncoded: string = encodeURIComponent(textGroupName);
    const url: string = this.wsiEndpointService.entryPoint + tablesUrl + 'local/' + systemId + '/' + textGroupNameDoubleEncoded + '/text';

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.tables, 'getTextAndColorForTextGroupEntries()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.tables, 'getTextAndColorForTextGroupEntries()', this.errorService)
      ));
  }

  private extractIconForTextGroupEntry(response: string): string {

    this.traceService.info(TraceModules.tables, 'getIconForTextGroupEntry(): call returned');
    const body: string = response;
    return body;

  }

  private extractTableWithSubgroup(res: HttpResponse<any>): DisciplineWithSubgroup[] | null {
    this.traceService.info(TraceModules.tables, 'getTableWithSubgroup(): call returned...');
    return res.body;
  }

  private extractGlobalText(res: HttpResponse<any>): TextEntry[] | null {

    this.traceService.info(TraceModules.tables, 'getGlobalText(): call returned. Creating text entries now...');
    return this.extractTextArray(res.body);
  }

  private extractTextArray(list: any): TextEntry[] | null {
    if (list == undefined) {
      return null;
    }

    const entryArr: TextEntry[] = [];
    for (const item in list) {
      if (list.hasOwnProperty(item)) {
        const itemValue: any = list[item];
        if (itemValue.Value != undefined && itemValue.Text != undefined) {
          const v: number = itemValue.Value;
          const t: string = itemValue.Text;
          let subT: TextEntry[] | null = null;
          if (itemValue.SubText != undefined) {
            subT = this.extractTextArray(itemValue.SubText);
          }
          entryArr.push(new TextEntry(v, t, subT));
        }
      }
    }
    return entryArr;
  }

  private extractDataTables(res: HttpResponse<any>): Map<number, string> {

    this.traceService.info(TraceModules.tables, 'getTable(): call returned. Creating table map now...');

    const table: Map<number, string> = new Map<number, string>();
    for (const property in res.body) {
      if (res.body.hasOwnProperty(property)) {
        table.set(Number(property).valueOf(), res.body[property]);
      }
    }

    if (this.traceService.isDebugEnabled(TraceModules.tables)) {
      let tableStr = '';
      table.forEach((value, key) => {
        tableStr = tableStr + '\n' + key + '=' + value;
      });
      this.traceService.debug(TraceModules.tables, 'Retrieved tables:%s', tableStr);
    }
    return table;
  }

  private extractDataSubTables(res: HttpResponse<any>): Map<number, Map<EventColors, string>> {

    this.traceService.info(TraceModules.tables, 'getSubTable(): call returned. Creating sub table map now...');

    const table: Map<number, Map<EventColors, string>> = new Map<number, Map<EventColors, string>>();
    for (const property in res.body) {
      if (res.body.hasOwnProperty(property)) {
        const subTable: Map<number, string> = new Map<number, string>();
        table.set(Number(property).valueOf(), subTable);
        const subtableObj: any = res.body[property];
        for (const subproperty in subtableObj) {
          if (subtableObj.hasOwnProperty(subproperty)) {
            subTable.set(Number(subproperty).valueOf(), subtableObj[subproperty]);
          }
        }
      }
    }

    if (this.traceService.isDebugEnabled(TraceModules.tables)) {
      let tableStr = 'Retrieved subtables:';
      table.forEach((value, key) => {
        tableStr = tableStr + '\n\nFor id=' + key;
        value.forEach((subValue, subKey) => {
          tableStr = tableStr + '\n' + EventColors[subKey] + '=' + subValue;
        });
      });
      this.traceService.debug(TraceModules.tables, tableStr);
    }
    return table;
  }

  private extractDataGlobalIconExt(res: HttpResponse<string>): IconImage | undefined {
    let iconImage: IconImage | undefined;
    if (res) {
      const contentType: string | null = res.headers.get('content-type');
      iconImage = {
        imageFormat: contentType?.includes('image/svg') ? 'SVG' : 'PNG',
        image: res.body!
      };
    }
    this.traceService.info(TraceModules.tables, 'getGlobalIconExt(): call returned, iconFmt=%s', iconImage ? iconImage.imageFormat : undefined);
    return iconImage;
  }

  private extractDataGlobalIcon(res: string): string {
    const iconStr: string = res; // icon as base64 encoded png image
    this.traceService.info(TraceModules.tables, 'getGlobalIcon(): call returned, val=%s', iconStr);
    return iconStr;
  }
}
