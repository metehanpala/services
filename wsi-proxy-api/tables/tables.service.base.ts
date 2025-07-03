import { Observable } from 'rxjs';

import {
  DisciplineWithSubgroup,
  EventColors,
  IconImage,
  LocalTextGroupEntry,
  ObjectTypeWithSubgroup,
  SubTables,
  Tables,
  TextEntry } from './data.model';

/**
 * Base class for the WSI tables service.
 * See the WSI documentation for details.
 */
export abstract class TablesServiceBase {

  /**
   * Gets the sepecified table from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {Tables } table Supported tables are: 'categories', 'disciplines', 'objecttypes', 'units', 'timefilter'
   * @returns {Observable<Map<number, string>>}
   *
   * @memberOf TablesBase
   */
  public abstract getTable(table: Tables): Observable<Map<number, string>>;

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
  public abstract getTableWithSubgroup(table: Tables): Observable<DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[]>;

  /**
   * Gets the specifed subtable from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {Tables } table
   * @param {SubTables } subTable
   * @returns {Observable<Map<number, Map<EventColors, string>>>}
   *
   * @memberOf TablesBase
   */
  public abstract getSubTable(table: Tables, subTable: SubTables): Observable<Map<number, Map<EventColors, string>>>;

  /**
   * Get the icon image for the specified system-global table entry.
   *
   * @abstract
   * @param {Tables } table One of a set of well-known global tables.
   * @param {number } index Index of the table entry.
   * @returns {Observable<string> } An Observable returning a base64 encoded string
   * representing the icon image in PNG format.
   *
   * @memberOf TablesBase
   */
  public abstract getGlobalIcon(table: Tables, index: number): Observable<string> ;

  public abstract getGlobalIconExt(table: Tables, index: number, format?: string): Observable<IconImage> ;

  /**
   * Get the text for the specified system-global table.
   *
   * @param {Tables } table One of a set of well-known global tables: 'disciplines', 'subdisciplines', 'objecttypes', 'objectsubtypes', 'categories'
   * @param includeSubText Flag indicating if sub-text (subgroup) should be included in response.
   * @returns {TextEntry[] } Array of text entries for the specified table.
   */
  public abstract getGlobalText(table: Tables, includeSubText: boolean): Observable<TextEntry[]>;

  /**
   * Get the icon for the specified system, table and table index.
   * @param systemId   The system id indicating from which system the image group should be retrieved.
   * @param tableName  The name of the text group
   * @param index      The value of the text group entry to retrieve
   */
  public abstract getIconForTextGroupEntry(systemId: string, tableName: string, index: string): Observable<string>;

  /**
   * Get the text and color for the specified system, table and table index.
   * @param systemId   The system id indicating from which system the image group should be retrieved.
   * @param tableName  The name of the text group
   * @param index      The value of the text group entry to retrieve
   */
  public abstract getTextAndColorForTextGroupEntry(systemId: string, tableName: string, index: string): Observable<LocalTextGroupEntry>;

  /**
   * Get the states for the specified system, table and table index.
   * @param systemId       The system id indicating from which system the state should be retrieved.
   * @param textGroupName  The name of the text group
   */
  public abstract getTextAndColorForTextGroupEntries(systemId: string, textGroupName: string): Observable<LocalTextGroupEntry[]>;
}
