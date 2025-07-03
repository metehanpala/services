/* eslint-disable @typescript-eslint/naming-convention */

export interface SessionRepresentation {
  SessionId: string;
  UserId: number;
  UserName: string;
  HostName: string;
  SessionType: SessionTypesKeyValue;
  LogonTime: Date;
  ClientProfile: string;
  SessionState: SessionStateKeyValue;
  AccessPoint: string;

}
export interface SessionTypesKeyValue {
  Key: SessionTypes;
  Value: string;
}

export enum SessionTypes {
  Desktop = 0,
  Web = 1,
  Sso = 2,
  Wsi = 3
}

export interface SessionStateKeyValue {
  Key: SessionStates;
  Value: string;
}

export enum SessionStates {
  Active = 0,
  TerminationOnRequest = 1,
  Deactivated = 2
}

export interface SubsWsiSessions {
  ErrorCode: number;
  Key: string;
  RequestId: string;
  RequestFor: string;
}

export interface SessionsData {
  SubscriptionKey: string;
  SessionRepresentations: SessionRepresentation[];
}