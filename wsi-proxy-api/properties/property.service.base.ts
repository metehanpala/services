import { Observable } from 'rxjs';

import { PropertyDetails, PropertyInfo } from '../shared/data.model';

/**
 * Base class for a property service.
 * See WSI API documentation (Property Service and Property Value Service) for details.
 */
export abstract class PropertyServiceBase {

  /**
   * Retrieves the property names of an object
   *
   * @abstract
   * @param {string } objectOrPropertyId The ObjectId OR the Object.PropertyId.
   * Note, that all property names are returned no matter if the ObjectId or the Object.PropertyId is handed over.
   * Also imortant to note: the reply contains a field ObjectId. The content of this files matches the parameter handed over on the request.
   * @returns {Observable<PropertyInfo<string>>}
   *
   * @memberOf PropertyServiceBase
   */
  public abstract readPropertyNames(objectOrPropertyId: string): Observable<PropertyInfo<string>>;

  /**
   * Retrieves properties (meta data) without any runtime values for an object or property.
   * See WSI API specification (Property Service) for details.
   *
   * @abstract
   * @param {string } objectOrPropertyId The ObjectId OR PropertyId
   * @param {number } requestType See WSI documentation.
   * requestType = 1: returns attributes only; the parameter "readAllProperties" has no effect for this request type;
   * the attributes are always returned no matter if an ObjectId or PropertyId is handed over.
   * requestType = 2: returns full property information without attributes,
   * If an ObjectId and the parameter "readAllProperties" equals false, the property information of the "Main Property" is returned!
   * If an ObjectId and the parameter "readAllProperties" equals true, the property information of all properties is returned!
   * If a PropertyId and the parameter "readAllProperties" equals false, the property information of the specified PropertyId is returned!
   * If a PropertyId and the parameter "readAllProperties" equals true, the property information of all properties of the object is returned!
   * requestType = 3: returns full property information and always attributes; otherwise the same specification as for requestType 2
   * @param {boolean } readAllProperties, appies only for requestType 2 and 3;
   * @returns {Observable<PropertyInfo<PropertyDetails>[]>}
   *
   * @memberOf PropertyServiceBase
   */
  public abstract readProperties(objectOrPropertyId: string, requestType: number, readAllProperties: boolean,
    booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): Observable<PropertyInfo<PropertyDetails>[]>;

  /**
   * Retrieves properties (meta data) without any runtime values for multiple multiple objects OR properties.
   * This is the bulk version of "readProperties"
   * See WSI API specification (Property Service) for details.
   *
   * @abstract
   * @param {string[] } objectOrPropertyIds Object OR Property Ids
   * @param {number } requestType See WSI documentation.
   * requestType = 1: returns attributes only; the parameter "readAllProperties" has no effect for this request type;
   * the attributes are always returned no matter if an ObjectId or PropertyId is handed over.
   * requestType = 2: returns full property information without attributes,
   * If an ObjectId and the parameter "readAllProperties" equals false, the property information of the "Main Property" is returned!
   * If an ObjectId and the parameter "readAllProperties" equals true, the property information of all properties is returned!
   * If a PropertyId and the parameter "readAllProperties" equals false, the property information of the specified PropertyId is returned!
   * If a PropertyId and the parameter "readAllProperties" equals true, the property information of all properties of the object is returned!
   * requestType = 3: returns full property information and always attributes; otherwise the same specification as for requestType 2
   * @param {boolean } readAllProperties, appies only for requestType 2 and 3;
   * @returns {Observable<PropertyInfo<PropertyDetails>[]>}
   *
   * @memberOf PropertyServiceBase
   */
  public abstract readPropertiesMulti(objectOrPropertyIds: string[], requestType: number,
    readAllProperties: boolean, booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): Observable<PropertyInfo<PropertyDetails>[]>;

  /**
   * Reads the icon of a property
   *
   * @abstract
   * @param {string } propertyId
   * @returns {Observable<string>}
   * @memberof PropertyServiceBase
   */
  public abstract readPropertyImage(propertyId: string): Observable<string>;
}
