import { Observable } from 'rxjs';

import { PropertyCommand } from './data.model';

/**
 * Base class for the ReadCommand service.
 * See WSI API documentation (Command Service) for details.
 */
export abstract class ReadCommandServiceBase {

  /**
   * Reads the list of available commands for a single propertyId.
   * See WSI API specification for details.
   *
   * @abstract
   * @param {string } propertyId The Property to read a list of available commands for
   * @param {string } [commandId] Optional filter for a specific commandId
   * @param {boolean } [enabledCommandsOnly] If set to True only currently enabled commands will be returned
   * @param {string } [clientType] If set, commands can be filtered for specific clients (All, Headless, Headful)
   * @returns {Observable<PropertyCommand> } List of available commands for the given property
   *
   * @memberOf ReadCommandServiceBase
   */
  public abstract readPropertyCommand(
    propertyId: string,
    commandId?: string,
    enabledCommandsOnly?: boolean,
    clientType?: string): Observable<PropertyCommand>;

  /**
   * Reads the lists of available commands for multiple properties, based on a list of propertyIds.
   * See WSI API specification for details.
   *
   * @abstract
   * @param {string[] } propertyIds A list of Properties to read a list of available commands for
   * @param {string } [commandId] Optional filter for a specific commandId
   * @param {boolean } [enabledCommandsOnly] If set to True only currently enabled commands will be returned
   * @param {string } [clientType] If set, commands can be filtered for specific clients (All, Headless, Headful)
   * @returns {Observable<PropertyCommand[]> } Array of lists of available commands for the given properties
   *
   * @memberOf ReadCommandServiceBase
   */
  public abstract readPropertyCommands(
    propertyIds: string[],
    commandId?: string,
    enabledCommandsOnly?: boolean,
    clientType?: string,
    booleansAsNumericText?: boolean): Observable<PropertyCommand[]>;
}
