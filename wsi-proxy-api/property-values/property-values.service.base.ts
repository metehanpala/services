import { Observable } from 'rxjs';

import { PropertyDetails, PropertyInfo } from '../shared/data.model';

/**
 * Base class for a property service.
 * See WSI API documentation (Property Service and Property Value Service) for details.
 */
export abstract class PropertyValuesServiceBase {

  /**
   * Retrieves properties with runtime values and attributes for an object or property.
   * See WSI API specification (Property Values Service) for details.
   *
   * @abstract
   * @param {string } objectOrPropertyId The ObjectId OR PropertyId
   * @param {boolean } readAllProperties If true then all the properties for the requested objectId (or propertyId) will be returned;
   * If false, the main property will be returned if an objectId has been given; or the requested property will be returned if a propertyId has been given.
   * @returns {Observable<PropertyInfo<PropertyDetails>>}
   *
   * @memberOf PropertyServiceBase
   */
  public abstract readPropertiesAndValue(objectOrPropertyId: string, readAllProperties: boolean,
    booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): Observable<PropertyInfo<PropertyDetails>>;
}
