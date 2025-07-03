import { Observable } from 'rxjs';

import { BrowserObject, ObjectNode, Page, SearchOption, SystemBrowserSubscription, SystemBrowserSubscriptionKey, ViewNode } from './data.model';

/**
 * Base class for a system browser service.
 * See the WSI documentation for details.
 */
export abstract class SystemBrowserServiceBase {

  /**
   * Gets views from the system.
   * See also WSI API specification.
   *
   * @param {number } systemId? Optional system Id. If specified, views from this system are returned only.
   * If not specified, views from all systems are returned.
   * @returns An observable with an array of {ViewNode } objects.
   */
  public abstract getViews(systemId?: number): Observable<ViewNode[]>;

  /**
   * Gets the child nodes of the specified parent node.
   * See also WSI API specification.
   *
   * @abstract
   * @param {number } systemId
   * @param {number } viewId
   * @param {string } parentNode, the designation of the parent node.
   * @param {boolean} sortByName
   * @returns {Observable<BrowserObject[]>}
   *
   * @memberOf SystemBrowserBase
   */
  public abstract getNodes(systemId: number, viewId: number, parentNode: string, sortByName?: boolean): Observable<BrowserObject[]>;

  /**
   * Searches for nodes.
   * For details see WSI specification.
   *
   * @abstract
   * @param {number } systemId
   * @param {string } searchString
   * @param {number } [viewId]
   * @param {SearchOption } [searchOption]
   * @param {boolean } [caseSensitive]
   * @param {boolean } [groupByParent]
   * @param {number } [size]
   * @param {number } [page]
   * @param {string } [disciplineFilter]
   * @param {string } [objectTypeFilter]
   * @param {string } [aliasFilter]
   * @param {boolean } [alarmSuppression]
   * @returns {Observable<Page>}
   *
   * @memberOf SystemBrowserBase
   */
  public abstract searchNodes(systemId: number, searchString: string, viewId?: number, searchOption?: SearchOption, caseSensitive?: boolean,
    groupByParent?: boolean, size?: number, page?: number, disciplineFilter?: string, objectTypeFilter?: string,
    alarmSuppresion?: boolean,
    aliasFilter?: string): Observable<Page>;

  /**
   * Searches for nodes.
   * For details see WSI specification.
   *
   * @param {number } systemId
   * @param {string } searchString
   * @param {boolean } [groupByParent=undefined]
   * @returns {Observable<Page>}
   *
   * @memberOf SystemBrowserService
   */
  public abstract searchNodeMultiple(systemId: number, searchString: string[], groupByParent?: boolean): Observable<ObjectNode[]>;

  /**
   * Subscribes for system browser node changes
   * For details see WSI specification.
   *
   * @abstract
   * @param {string[] } designations
   * @returns {Observable<SystemBrowserSubscriptionKey>}
   *
   * @memberOf SystemBrowserBase
   */
  public abstract subscribeNodeChanges(designations: string[]): Observable<SystemBrowserSubscriptionKey>;

  /**
   * Notifies changes related to the system browser.
   * For details see WSI specification.
   *
   * @abstract
   * @returns {Observable<SystemBrowserSubscription>}
   *
   * @memberOf SystemBrowserBase
   */
  public abstract nodeChangeNotification(): Observable<SystemBrowserSubscription>;

  /**
   * Returns searching result for multiple ObjectIds
   * See also WSI API specification.
   *
   * @abstract
   * @param {any } systemId
   * @param {any } viewId
   * @param {string[] } deviceIdArr
   * @returns {Observable<any>}
   *
   * @memberOf SystemBrowserBase
   */
  public abstract searchViewNodeMultiple(systemId: any, viewId: any, deviceIdArr: string[]): Observable<any>;
}
