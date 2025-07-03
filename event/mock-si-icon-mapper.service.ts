import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { TablesData, TablesEx } from '../icons-mapper/data.model';

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
export class MockSiIconMapperService {
  public subtableResponse: BehaviorSubject<TablesData | null> = new BehaviorSubject<TablesData | null>(null);
  public iconResponse: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  protected tablesData: TablesData | undefined;

  public getTablesData(): Observable<TablesData | null> {
    return this.subtableResponse.asObservable();
  }

  public getGlobalIcon(table: TablesEx, index: number): Observable<string | null> {
    return this.iconResponse.asObservable();
  }

  public getGlobalIconSync(table: TablesEx, index: number): string {
    return '';
  }
}
