/* eslint-disable */
export interface PublicKeyResponse {
  SessionKey: string;
  PublicKey: string;
}

export class EncryptedPasswordResponse {
  private readonly _sessionKey: string;
  public get SessionKey(): string {
    return this._sessionKey;
  }

  private readonly _encryptedPassword: string;
  public get EncryptedPassword(): string {
    return this._encryptedPassword;
  }

  constructor(sessionKey: string, encryptedPassword: string) {
    this._sessionKey = sessionKey;
    this._encryptedPassword = encryptedPassword;
  }
}
/* eslint-enable */
