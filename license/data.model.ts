/* eslint-disable @typescript-eslint/naming-convention */

export class License {
  public licenseModeName: string | undefined;
  public licenseModeValue: number | undefined;
  public expirationTime: number | undefined;
}

export interface SubscriptionLicense {
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}
