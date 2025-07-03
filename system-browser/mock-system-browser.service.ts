import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ObjectAttributes } from '../wsi-proxy-api/shared/data.model';
import { BrowserObject, ObjectNode, Page, SearchOption, SystemBrowserSubscription,
  SystemBrowserSubscriptionKey, ViewNode } from '../wsi-proxy-api/system-browser/data.model';
import { SystemBrowserServiceBase } from '../wsi-proxy-api/system-browser/system-browser.service.base';

/**
 * GMS system browser implementation.
 * @extends SystemBrowserBase
 */
@Injectable({
  providedIn: 'root'
})
export class MockSystemBrowserService extends SystemBrowserServiceBase {

  /* eslint-disable @typescript-eslint/naming-convention */

  private readonly viewNodes: ViewNode[] = [
    {
      'Name': 'name1',
      'Designation': 'designation1',
      'Descriptor': 'descriptor1',
      'SystemId': 1,
      'SystemName': 'System1',
      'ViewId': 2,
      'ViewType': 0
    },
    {
      'Name': 'name2',
      'Designation': 'designation2',
      'Descriptor': 'descriptor2',
      'SystemId': 3,
      'SystemName': 'System3',
      'ViewId': 4,
      'ViewType': 1
    },
    {
      'Name': 'name3',
      'Designation': 'designation3',
      'Descriptor': 'descriptor3',
      'SystemId': 1,
      'SystemName': 'System1',
      'ViewId': 2,
      'ViewType': 2
    },
    {
      'Name': 'name4',
      'Designation': 'designation4',
      'Descriptor': 'descriptor4',
      'SystemId': 3,
      'SystemName': 'System3',
      'ViewId': 4,
      'ViewType': 3
    }
  ];

  private readonly objectAttributes: ObjectAttributes[] =
    [
      {
        'Alias': 'alias',
        'DefaultProperty': 'defaultProperty',
        'DisciplineDescriptor': 'disciplineDescriptor',
        'DisciplineId': 1,
        'FunctionName': 'functionName',
        'ManagedType': 1,
        'ManagedTypeName': 'managedTypeName',
        'ObjectId': 'objectId',
        'SubDisciplineDescriptor': 'subDisciplineDescriptor',
        'SubDisciplineId': 2,
        'SubTypeDescriptor': 'subTypeDescriptor',
        'SubTypeId': 3,
        'TypeDescriptor': 'typeDescriptor',
        'TypeId': 4,
        'ObjectModelName': 'objectModelName'
      },
      {
        'Alias': 'alias',
        'DefaultProperty': 'defaultProperty',
        'DisciplineDescriptor': 'disciplineDescriptor',
        'DisciplineId': 1,
        'FunctionName': 'functionName',
        'ManagedType': 1,
        'ManagedTypeName': 'managedTypeName',
        'ObjectId': 'objectId',
        'SubDisciplineDescriptor': 'subDisciplineDescriptor',
        'SubDisciplineId': 2,
        'SubTypeDescriptor': 'subTypeDescriptor',
        'SubTypeId': 3,
        'TypeDescriptor': 'typeDescriptor',
        'TypeId': 4,
        'ObjectModelName': 'objectModelName'
      }
    ];

  private readonly browserObjects: BrowserObject[] =
    [
      {
        'Attributes': this.objectAttributes[0],
        'Designation': 'designation1',
        'Descriptor': 'descriptor1',
        'HasChild': true,
        'Name': 'name1',
        'Location': 'location1',
        'ObjectId': 'objectId1',
        'SystemId': 1,
        'ViewId': 2,
        'ViewType': 0
      },
      {
        'Attributes': this.objectAttributes[1],
        'Designation': 'designation2',
        'Descriptor': 'descriptor2',
        'HasChild': false,
        'Name': 'name2',
        'Location': 'location2',
        'ObjectId': 'objectId2',
        'SystemId': 3,
        'ViewId': 4,
        'ViewType': 0
      }

    ];

  /* eslint-enable @typescript-eslint/naming-convention */

  public constructor() {
    super();
  }

  /**
   * Gets views from the system.
   * @param {number } systemId? Optional system Id. If specfied, views from this system are returned only.
   * If not specified, views from all systems are returned.
   * @returns An observable with an array of {ViewNode } objects.
   */
  public getViews(systemId?: number): Observable<ViewNode[]> {
    return of(this.viewNodes);
  }

  public getNodes(systemId: number, viewId: number, parentNode: string): Observable<BrowserObject[]> {
    return of(this.browserObjects);
  }

  public searchNodes(systemId: number, searchString: string, viewId?: number, searchOption?: SearchOption, caseSensitive = true,
    groupByParent = false, size?: number, page?: number, disciplineFilter?: string, objectTypeFilter?: string, alarmSuppression?: boolean,
    aliasFilter?: string): Observable<Page> {

    return null!;
  }

  public searchNodeMultiple(systemId: number, searchString: string[], groupByParent = false): Observable<ObjectNode[]> {
    return null!;
  }

  public subscribeNodeChanges(designations: string[]): Observable<SystemBrowserSubscriptionKey> {
    return null!;
  }

  public nodeChangeNotification(): Observable<SystemBrowserSubscription> {
    return undefined!;
  }

  public searchViewNodeMultiple(systemId: any, viewId: any, deviceIdArr: string[]): Observable<any> {
    return null!;
  }
}
