import { SubscriptionGms } from '../shared/data.model';

/* eslint-disable @typescript-eslint/naming-convention */

export interface EnumerationItem {
  Descriptor: string;
  Value: number;
}

export interface SubscriptionWsiCmd {
  Key: number;
  ErrorCode: number;
  PropertyId: string; // contains the effective addressed propertyId
  RequestId: string; // subscription request context
  RequestFor: string; // Notification function name where client will receive further updates
  SubscriptionId: string; // contains the original requested string (Id)
}

/* eslint-enable @typescript-eslint/naming-convention */

export class SubscriptionGmsCmd implements SubscriptionGms {
  constructor(private readonly subWsi: SubscriptionWsiCmd) {
  }
  public get key(): number {
    return this.subWsi.Key;
  }
  public get errorCode(): number {
    return this.subWsi.ErrorCode;
  }
  /**
   * Describes the the effective addressed propertyId
   *
   * @readonly
   * @type {string}
   * @memberof SubscriptionGmsCmd
   */
  public get propertyId(): string {
    return this.subWsi.PropertyId;
  }
  /**
   * Describes/contains the original requested string (Id)
   *
   * @readonly
   * @type {string}
   * @memberof SubscriptionGmsCmd
   */
  public get originalId(): string {
    return this.subWsi.SubscriptionId;
  }
}

/* eslint-disable @typescript-eslint/naming-convention */

export enum CommandParamType {
  Default = 0, // normal parameter (not special)
  CnsDesignation = 1 // parameter holds CNS designation of data-point being commanded
}

export interface CommandParameters {
  DataType: string;
  DefaultValue: string;
  Descriptor: string;
  EnumerationTexts: EnumerationItem[];
  Max: string;
  Min: string;
  Name: string;
  Order: number;
  Application?: number;
  AllowDayOfWeek?: boolean;
  AllowWildcards?: boolean;
  BACnetDateTimeDetail?: number;
  BACnetDateTimeResolution?: number;
  DurationDisplayFormat?: number;
  DurationValueUnits?: number;
  IsPassword?: boolean;
  ParameterType?: number;
  Resolution?: number;
  UnitDescriptor?: string;
}

export interface Command {
  Descriptor: string;
  Parameters: CommandParameters[];
  PropertyId: string;
  Id: string;
  IsDefault: boolean;
  Configuration?: number;
  GroupNumber?: number;
}

export interface PropertyCommand {
  Commands: Command[];
  PropertyId: string;
  ErrorCode: number;
  SubscriptionKey: number;
}

export interface CommandInput {
  Name: string;
  DataType: string;
  Value: string;
  Comments: CommentsInput;
  Password: string;
  SuperName?: string;
  SuperPassword?: string;
  SessionKey?: string;
}

export interface CommandInput2 {
  Name: string;
  DataType: string;
  Value: string;
}

export interface CommentsInput {
  CommonText: string;
  MultiLangText: string[];
}

export interface BulkCommandInput {
  CommandInputForExecution: CommandInput[];
  PropertyIds: string[];
}

export interface BulkCommandInput2 {
  CommandInputForExecution: CommandInput2[];
  PropertyIds: string[];
  Comments: CommentsInput;
  Password: string;
  SuperName?: string;
  SuperPassword?: string;
  SessionKey?: string;
}

export interface ValidationProps {
  Comments: CommentsInput;
  Password: string;
  SuperName?: string;
  SuperPassword?: string;
  SessionKey?: string;
}

export interface CommandResponse {
  PropertyId: string;
  ErrorCode: number;
}

export interface BulkCommandResponse {
  Responses: CommandResponse[];
}

/* eslint-enable @typescript-eslint/naming-convention */
