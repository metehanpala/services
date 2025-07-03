/* eslint-disable @typescript-eslint/naming-convention */

export interface MultiMonitorConfigurationData {
  Configuration: string;
  OverruleSettings: boolean;
  HostName: string;
}

export interface StationData {
  StationIdentifier: string;
  DistinguishedSubjectName: string;
  ErrorCode: number;
}

export interface StationDataPerUser {
  UserName: string;
  StationIdentifier: string;
  DistinguishedSubjectName: string;
  ErrorCode: number;
}
/* eslint-enable @typescript-eslint/naming-convention */
