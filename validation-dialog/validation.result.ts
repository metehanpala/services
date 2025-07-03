import { CommentsInput } from "../wsi-proxy-api";
import { ValidationResultStatus } from "./validation-result.status";

export class ValidationResult {

  private _status: ValidationResultStatus | undefined;

  public get Status(): ValidationResultStatus | undefined {
    return this._status;
  }

  public set Status(value: ValidationResultStatus | undefined) {
    this._status = value;
  }

  private _error: string | undefined;

  public get Error(): string | undefined {
    return this._error;
  }

  public set Error(value: string | undefined) {
    this._error = value;
  }

  private _comments: CommentsInput | undefined;

  public get Comments(): CommentsInput | undefined {
    return this._comments;
  }

  public set Comments(value: CommentsInput | undefined) {
    this._comments = value;
  }

  private readonly _password: string | undefined;

  public get Password(): string | undefined {
    return this._password;
  }

  private _superName: string | undefined;

  public get SuperName(): string | undefined {
    return this._superName;
  }

  public set SuperName(value: string | undefined) {
    this._superName = value;
  }

  private _superPassword: string | undefined;

  public get SuperPassword(): string | undefined {
    return this._superPassword;
  }

  public set SuperPassword(value: string | undefined) {
    this._superPassword = value;
  }

  private _sessionKey: string | undefined;

  public get SessionKey(): string | undefined {
    return this._sessionKey;
  }

  public set SessionKey(value: string | undefined) {
    this._sessionKey = value;
  }

  constructor(status?: ValidationResultStatus, error?: string, comments?: CommentsInput, password?: string,
    superName?: string, superPassword?: string, sessionKey?: string) {
    this._status = status;
    this._error = error;
    this._comments = comments;
    this._password = password;
    this._superName = superName;
    this._superPassword = superPassword;
    this._sessionKey = sessionKey;
  }
}
