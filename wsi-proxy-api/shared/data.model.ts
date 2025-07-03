/* eslint-disable @typescript-eslint/naming-convention */

import { CommentsInput } from '../command';

export interface Link {
  Rel: string;
  Href: string;
  IsTemplated: boolean;
}

export const enum ConnectionState {
  Connecting = 0,
  Connected = 1,
  Reconnecting = 2,
  Disconnected = 4
}

export interface ObjectAttributes {
  Alias: string;
  DefaultProperty: string;
  DisciplineDescriptor: string;
  DisciplineId: number;
  FunctionDefaultProperty?: string;
  FunctionName: string;
  ManagedType: number;
  ManagedTypeName: string;
  ObjectId: string;
  SubDisciplineDescriptor: string;
  SubDisciplineId: number;
  SubTypeDescriptor: string;
  SubTypeId: number;
  TypeDescriptor: string;
  TypeId: number;
  ObjectModelName: string;
  CustomData?: any;
  ValidationRules?: any;
}

export interface SubscriptionGms {
  errorCode: number;
  key: number;
  originalId: string;
  propertyId: string;
}

export interface SubscriptionWsiVal {
  Key: number;
  AttributeId: string;
  PropertyId: string;
  ObjectId: string;
  PropertyName: string;
  OriginalObjectOrPropertyId: string;
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

/* eslint-enable @typescript-eslint/naming-convention */

export class SubscriptionGmsVal implements SubscriptionGms {
  constructor(private readonly subWsi: SubscriptionWsiVal) {
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
    return this.subWsi.OriginalObjectOrPropertyId;
  }
}

/* eslint-disable @typescript-eslint/naming-convention */

export interface SubscriptionDeleteWsi {
  Key: number;
  ErrorCode: number;
}

export interface PropertyInfo<T> {
  ErrorCode: number;
  ObjectId: string;
  Attributes: ObjectAttributes;
  Properties: T[];
  FunctionProperties: T[];
}

export interface PropertyDetails {
  PropertyName: string;
  Descriptor: string;
  IsArray: boolean;
  Order: number;
  Resolution: number;
  Type: string;
  Value: Value;
  AllowDayOfWeek?: boolean;
  AllowWildcards?: boolean;
  BACnetDateTimeDetail?: number;
  BACnetDateTimeResolution?: number;
  BitStringLabels?: string[];
  DisplayType?: number;
  DisplayOffNormalOnly?: boolean;
  DurationDisplayFormat?: number;
  DurationValueUnits?: number;
  ElementLabels?: string[];
  Min?: string;
  Max?: string;
  NormalValue?: string;
  UnitDescriptor?: string;
  UnitId?: number;
  Usage?: number;
  TextTable?: string;
  MappedPropertyId?: string;
  PropertyAbsent?: boolean;
  PropertyType?: number;
  // BackGoundColor?: Color;
}

export interface Value {
  Value: string;
  DisplayValue: string;
  Timestamp: string;
  QualityGood: boolean;
  Quality: string;
  IsPropertyAbsent?: boolean;
}

export interface ValueDetails {
  DataType: string;
  ErrorCode: number;
  SubscriptionKey: number;
  Value: Value;
  IsArray: boolean;
}

export interface ValidationRules {
  PredefinedCommentsId: string;
  CommentRule: string;
  Configuration: number;
  IsFourEyesEnabled: boolean;
  ReAuthentication: string;
}
export interface ValidationInput {
  Message?: string;
  Comments: CommentsInput;
  SessionKey: string;
  Password: string;
  SuperName: string;
  SuperPassword: string;
}

/* eslint-enable @typescript-eslint/naming-convention */
