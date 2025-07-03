import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

/**
 * Mock Category service.
 *
 * @export
 * @class Mock TableService
 * @extends {TablesServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class MockTablesService extends TablesServiceBase {

  public tableResponse: BehaviorSubject<Map<number, string> | null> = new BehaviorSubject<Map<number, string> | null>(null);
  public tableWithSubgroupResponse: BehaviorSubject<DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[] | null> =
    new BehaviorSubject<DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[] | null>(null);
  public subtableResponse: BehaviorSubject<Map<number, Map<EventColors, string>> | null> =
    new BehaviorSubject<Map<number, Map<EventColors, string>> | null>(null);

  private readonly texts: BehaviorSubject<TextEntry[] | never[]> = new BehaviorSubject<TextEntry[] | never[]>([]);
  private readonly localTextsGroup: BehaviorSubject<LocalTextGroupEntry | null> = new BehaviorSubject<LocalTextGroupEntry | null>(null);
  private readonly icon: BehaviorSubject<string> = new BehaviorSubject('');
  private readonly iconImage: BehaviorSubject<IconImage> = new BehaviorSubject({ imageFormat: 'PNG', image: '' });
  private readonly text: BehaviorSubject<string> = new BehaviorSubject('');
  private readonly localTextsGroupEntries: BehaviorSubject<LocalTextGroupEntry[] | null> = new BehaviorSubject<LocalTextGroupEntry[] | null>(null);

  public getTable(table: Tables): Observable<Map<number, string> | any> {
    return this.tableResponse.asObservable();
  }

  public getTableWithSubgroup(table: Tables): Observable<DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[] | any> {
    return this.tableWithSubgroupResponse.asObservable();
  }

  public getSubTable(table: Tables, subTable: SubTables): Observable<Map<number, Map<EventColors, string>> | any> {
    return this.subtableResponse.asObservable();
  }

  public getGlobalText(table: Tables, includeSubText: boolean): Observable<TextEntry[]> {
    return this.texts.asObservable();
  }

  public getGlobalIcon(table: Tables, index: number): Observable<string> {
    return this.icon.asObservable();
  }

  public getGlobalIconExt(table: Tables, index: number): Observable<IconImage> {
    return this.iconImage.asObservable();
  }

  public getIconForTextGroupEntry(systemId: string, tableName: string, index: string): Observable<string> {
    return this.text.asObservable();
  }

  public getTextAndColorForTextGroupEntry(systemId: string, tableName: string, index: string): Observable<LocalTextGroupEntry | any> {
    return this.localTextsGroup.asObservable();
  }

  public getTextAndColorForTextGroupEntries(systemId: string, tableName: string): Observable<LocalTextGroupEntry[] | any> {
    return this.localTextsGroupEntries.asObservable();
  }
}
