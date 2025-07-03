import { Observable } from 'rxjs';

import { ValidationInput } from '../shared';
import { BorderTimeRange, GeneralSetings, TrendAggregatedDataResult, TrendDataResult, 
  TrendSeriesInfo, TrendViewDefinition, TrendViewDefinitionUpdate } from './data.model';
/**
 * Base class for the WSI trends service.
 * See the WSI documentation for details.
 */
export abstract class TrendServiceBase {

  /**
   * Gets the TrendViewDefinition from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string} trendViewDefinitionDpId
   * @param {boolean} whether to return reduced trend definition
   * @returns {Observable<TrendViewDefinition>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract getTrendViewDefinition(trendViewDefinitionDpId: string): Observable<TrendViewDefinition>;

  /**
   * Gets the Trend data from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string} trendSeriesId
   * @param {string} fromDate
   * @param {string} toDate
   * @param {string} interval
   * @param {string} zoomRange? // Optional parameter
   * @returns {Observable<TrendDataResult>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract getTrendData(trendSeriesId: string, fromDate: string, toDate: string, interval: string, zoomRange?: number): Observable<TrendDataResult>;

  /**
   * Gets the Specific trend series id contained in a collector.
   *
   * @abstract
   * @param {string} object or property Id
   * @param {string} Id of the collector object
   * @returns {Observable<string[]>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract getTrendSeriesId(objectOrPropertyId: string, collectorId: string): Observable<string[]>;

  /**
   * Gets trend series info of specified object id
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string} object or property Id
   * @returns {Observable<TrendSeriesInfo[]>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract getTrendSeriesInfo(objectOrPropertyId: string): Observable<TrendSeriesInfo[]>;

  /**
   * Gets the border values of timerange for specified trend series id
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string} trend Series Id
   * @returns {Observable<BorderTimeRange>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract getBorderTimeRangeForTrend(trendSeriesId: string): Observable<BorderTimeRange>;

  /**
   * Create/Update TrendViewDefinition to WSI
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {TrendViewDefinitionUpdate} tvdUpdate tvd update model
   * @returns {Observable<TrendViewDefinition>} created/updated tvd objectid
   *
   * @memberOf TrendServiceBase
   */
  public abstract putTrendViewDefinition(tvdUpdate: TrendViewDefinitionUpdate): Observable<TrendViewDefinition>;

  /**
   * Delete the TrendViewDefinition from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string} trendViewDefinitionDpId
   * @returns {Observable<boolean>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract deleteTrendViewDefinition(trendViewDefinitionDpId: string, validationInput: ValidationInput): Observable<boolean>;

  /**
   * Delete the Online Trend Log from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string} onlineTrendLogDpId
   * @returns {Observable<boolean>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract deleteOnlineTrendLog(onlineTrendLogDpId: string, validationInput: ValidationInput): Observable<boolean>;

  /**
   * Gets the Trend Aggregated data from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string} trendSeriesId
   * @param {number} aggregateUnit
   * @param {string} fromDate
   * @param {string} toDate
   * @param {length} length
   * @returns {Observable<TrendAggregatedDataResult>}
   *
   * @memberOf TrendServiceBase
   */
  public abstract getTrendAggregatedData(
    trendSeriesId: string, 
    aggregateUnit: number, 
    fromDate: string, 
    toDate: string, 
    length: number
  ): Observable<TrendAggregatedDataResult>;
}
