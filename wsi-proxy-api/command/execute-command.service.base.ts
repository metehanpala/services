import { Observable } from 'rxjs';

import { BulkCommandInput, BulkCommandInput2, BulkCommandResponse, CommandInput } from './data.model';

/**
 * Base class for the ExecuteCommand service.
 * See WSI API documentation (Command Service) for details.
 */
export abstract class ExecuteCommandServiceBase {

  /**
   * Command the value of a single propertyId.
   * See WSI API specification for details.
   *
   * @abstract
   * @param {string } propertyId The Property to command
   * @param {string } commandId The specific command to execute
   * @param {CommandInput[] } commandInput Command parameter details, if required
   *
   * @memberOf ExecuteCommandServiceBase
   */
  public abstract executeCommand(propertyId: string, commandId: string, commandInput: CommandInput[]): Observable<void>;

  /**
   * Execute the same command on multiple properties of the same data point type.
   * See WSI API specification for details.
   *
   * @abstract
   * @param {string } commandId The specific command to execute
   * @param {BulkCommandInput } bulkCommandInput Command parameter details and a list of PropertyIds
   * @returns {Observable<BulkCommandResponse> } An Array of Command Responses, one for each command
   *
   * @memberOf ExecuteCommandServiceBase
   */
  public abstract executeCommands(commandId: string, bulkCommandInput: BulkCommandInput): Observable<BulkCommandResponse>;
  /**
   * Execute the same command on multiple properties of the same data point type with refactored bulkCommandInput
   * See WSI API specification for details.
   *
   * @abstract
   * @param {string } commandId The specific command to execute
   * @param {BulkCommandInput2 } bulkCommandInput2 Command parameter details, list of PropertyIds and validation object values
   * @returns {Observable<BulkCommandResponse> } An Array of Command Responses, one for each command
   *
   * @memberOf ExecuteCommandServiceBase
   */
  public abstract executeCommands2(commandId: string, bulkCommandInput: BulkCommandInput2): Observable<BulkCommandResponse>;

}
