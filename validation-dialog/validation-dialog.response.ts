import { ValidationDialogResult } from "./validation-dialog.result";
import { ValidationResult } from "./validation.result";

export class ValidationDialogResponse {
  private _validationDialogResult: ValidationDialogResult;
  public get ValidationDialogResult(): ValidationDialogResult {
    return this._validationDialogResult;
  }

  public set ValidationDialogResult(value: ValidationDialogResult) {
    if (this._validationDialogResult !== value) {
      this._validationDialogResult = value;
    }
  }

  private _result: ValidationResult;
  public get Result(): ValidationResult {
    return this._result;
  }

  public set Result(value: ValidationResult) {
    if (this._result === value) {
      this._result = value;
    }
  }

  private _sessionKey: string | undefined;
  public get SessionKey(): string | undefined {
    return this._sessionKey;
  }

  public set SessionKey(value: string) {
    if (value !== this._sessionKey) {
      this._sessionKey = value;
    }
  }

  private _encryptedSupervisorPassword: string | undefined;
  public get EncryptedSupervisorPassword(): string | undefined {
    return this._encryptedSupervisorPassword;
  }

  public set EncryptedSupervisorPassword(value: string) {
    if (value !== this._encryptedSupervisorPassword) {
      this._encryptedSupervisorPassword = value;
    }
  }

  constructor(validationDialogResult: ValidationDialogResult, result: ValidationResult, sessionKey?: string, encryptedSupervisorPassword?: string) {
    this._validationDialogResult = validationDialogResult;
    this._result = result;
    this._sessionKey = sessionKey;
    this._encryptedSupervisorPassword = encryptedSupervisorPassword;
  }
}
