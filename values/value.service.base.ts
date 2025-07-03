import { HttpClient } from '@angular/common/http';
import { TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { ValueDetails } from '../wsi-proxy-api/shared/data.model';

/**
 * Base class for the value subscription service.
 * See WSI API documentation (Value Service) for details.
 */
export abstract class ValueServiceBase {

  /**
   * Constructor
   * @param {TraceService } trace The trace service
   * @param {HttpClient } httpClient The Angular 2 http service
   */
  public constructor(public traceService: TraceService, protected httpClient: HttpClient) {
  }

  /**
   * Reads the value, based on the objectId or propertyId.
   * See WSI API specification for details.
   *
   * @abstract
   * @param {string } objectOrPropertyId
   * @returns {Observable<ValueDetails[]>}
   *
   * @memberOf ValueServiceBase
   */
  public abstract readValue(objectOrPropertyId: string, booleansAsNumericText?: boolean): Observable<ValueDetails[]>;

  /**
   * Reads multiple values, based on the objectIds or propertyIds.
   * See WSI API specification for details.
   *
   * @abstract
   * @param {string[] } objectOrPropertyId
   * @returns {Observable<ValueDetails[]>}
   *
   * @memberOf ValueServiceBase
   */
  public abstract readValues(objectOrPropertyId: string[], booleansAsNumericText?: boolean): Observable<ValueDetails[]>;
}
