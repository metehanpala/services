export class SystemConfig {
  private _csid: string;
  private _userDefinedSystemId: string;

  public constructor(csid: string, userDefinedSystemId: string) {
    this._csid = csid;
    this._userDefinedSystemId = userDefinedSystemId;
  }

  public get csid(): string {
    return this._csid;
  }

  public set csid(csid: string) {
    this._csid = csid;
  }

  public get userDefinedSystemId(): string {
    return this._userDefinedSystemId;
  }

  public set userDefinedSystemId(userDefinedSystemId: string) {
    this._userDefinedSystemId = userDefinedSystemId;
  }

}

/* eslint-disable @typescript-eslint/naming-convention */

export enum Operations {
  Add = 'add',
  Sub = 'sub'
}
export interface SystemInfo {
  Name: string;
  Id: number;
  IsOnline: boolean;
  Description?: string;
  SystemId?: string;
  UserDefinedName?: string;
  Csid?: string; // This is License Id
}

export interface LanguageInfo {
  ArrayIndex: number;
  Descriptor: string;
  Code: string;
}

/**
 * The object returned by wsi systems endpoint
 */
export interface SystemsResponseObject {
  Systems: SystemInfo[];
  Languages: LanguageInfo[];
  IsDistributed?: boolean;
  IdLocal?: number;
}

/**
 * The object to provide a new Path
 */
export interface SystemPath {
  Value: string;
  Path: string;
  Operation: Operations;
}

export interface SubscriptionWsiSystems {
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

export interface ServiceRequestSubscriptionModel {
  SystemId: number;
  Ids: number[];
}

export interface ServiceRequestInfo {
  IsConnected: boolean;
  ServiceId: number;
  SystemId: number;
}

/* eslint-enable @typescript-eslint/naming-convention */
