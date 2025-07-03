import { LocalTextGroupEntry } from "../wsi-proxy-api";
import { CommentRule } from "./comment.rule";
import { ReAuthentication } from "./re-authentication";
import { ValidateOpResponse } from "./validate-op.response";
import { ValidationCredentialType } from "./validation-credential.type";

export class ValidateOpInfo {
  private _isModalRequired: boolean | undefined;
  public get IsModalRequired(): boolean | undefined {
    return this._isModalRequired;
  }

  public set IsModalRequired(value: boolean | undefined) {
    if (this._isModalRequired !== value) {
      this._isModalRequired = value;
    }
  }

  private _isFourEyesEnabled: boolean | undefined;
  public get IsFourEyesEnabled(): boolean | undefined {
    return this._isFourEyesEnabled;
  }

  public set IsFourEyesEnabled(value: boolean | undefined) {
    if (this._isFourEyesEnabled !== value) {
      this._isFourEyesEnabled = value;
    }
  }

  private _isReauthenticationRequired: boolean | undefined;
  public get IsReauthenticationRequired(): boolean | undefined {
    return this._isReauthenticationRequired;
  }

  public set IsReauthenticationRequired(value: boolean | undefined) {
    if (this._isReauthenticationRequired !== value) {
      this._isReauthenticationRequired = value;
    }
  }

  private _hasPredefinedComment: boolean | undefined;
  public get HasPredefinedComment(): boolean | undefined {
    return this._hasPredefinedComment;
  }

  public set HasPredefinedComment(value: boolean | undefined) {
    if (this._hasPredefinedComment !== value) {
      this._hasPredefinedComment = value;
    }
  }

  private _isCommentMandatory: boolean | undefined;
  public get IsCommentMandatory(): boolean | undefined {
    return this._isCommentMandatory;
  }

  public set IsCommentMandatory(value: boolean | undefined) {
    if (this._isCommentMandatory !== value) {
      this._isCommentMandatory = value;
    }
  }

  private _predefinedComments: LocalTextGroupEntry[] | undefined;
  public get PredefinedComments(): LocalTextGroupEntry[] | undefined {
    return this._predefinedComments;
  }

  private _credentialType: ValidationCredentialType | undefined;
  public get CredentialType(): ValidationCredentialType | undefined {
    return this._credentialType;
  }

  private _authenticationFailed: boolean | undefined;
  public get AuthenticationFailed(): boolean | undefined {
    return this._authenticationFailed;
  }

  public set AuthenticationFailed(value: boolean | undefined) {
    this._authenticationFailed = value;
  }

  private _supervisorCannotValidateSelection: boolean | undefined;
  public get SupervisorCannotValidateSelection(): boolean | undefined {
    return this._supervisorCannotValidateSelection;
  }

  public set SupervisorCannotValidateSelection(value: boolean | undefined) {
    this._supervisorCannotValidateSelection = value;
  }

  private _hasSameUserAndSuperName = false;
  public get HasSameUserAndSuperName(): boolean {
    return this._hasSameUserAndSuperName;
  }

  private _isValidSupervisorState = true;
  public get IsValidSupervisorState(): boolean {
    return this._isValidSupervisorState;
  }

  private _isValidOperatorState = true;
  public get IsValidOperatorState(): boolean {
    return this._isValidOperatorState;
  }

  constructor(validateOpResponse: ValidateOpResponse) {
    this.initIsCommentMandatory(validateOpResponse);
    this.initIsReauthenticationRequired(validateOpResponse);
    this.initIsFourEyesEnabled(validateOpResponse);
    this.initIsModalRequired();
    this.initPredefinedComments(validateOpResponse);
    this.initHasPredefinedComment();
    this.initCredentialType();
  }

  public setInvalidSupervisorState(): void {
    this._isValidSupervisorState = false;
  }

  public resetValidSupervisorState(): void {
    this._isValidSupervisorState = true;
  }

  public setInvalidOperatorState(): void {
    this._isValidOperatorState = false;
  }

  public resetValidOperatorState(): void {
    this._isValidOperatorState = true;
  }

  public resetAuthenticationFailed(): void {
    this._authenticationFailed = false;
  }

  public resetSupervisorCannotValidateSelection(): void {
    this._supervisorCannotValidateSelection = false;
  }

  public setSameUserAndSuperName(): void {
    this._hasSameUserAndSuperName = true;
  }

  public resetSameUserAndSuperName(): void {
    this._hasSameUserAndSuperName = false;
  }

  public resetErrorStates(): void {
    this.resetValidOperatorState();
    this.resetValidSupervisorState();
    this.resetAuthenticationFailed();
    this.resetSupervisorCannotValidateSelection();
    this.resetSameUserAndSuperName();
  }

  private initPredefinedComments(validateOpResponse: ValidateOpResponse): void {
    this._predefinedComments = validateOpResponse.PredefinedComments;
  }

  private initIsCommentMandatory(validateOpResponse: ValidateOpResponse): void {
    this.IsCommentMandatory = validateOpResponse?.CommentRule === CommentRule.MANDATORY;
  }

  private initHasPredefinedComment(): void {
    const length: number = this?.PredefinedComments?.length ?? 0;
    this.HasPredefinedComment = length > 0;
  }

  private initIsReauthenticationRequired(validateOpResponse: ValidateOpResponse): void {
    this.IsReauthenticationRequired = validateOpResponse?.ReAuthentication === ReAuthentication.REENTERPW;
  }

  private initIsFourEyesEnabled(validateOpResponse: ValidateOpResponse): void {
    this.IsFourEyesEnabled = validateOpResponse?.IsFourEyesEnabled;
  }

  private initIsModalRequired(): void {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    this.IsModalRequired = this.IsCommentMandatory || this.IsFourEyesEnabled || this.IsReauthenticationRequired;
  }

  private initCredentialType(): void {
    if (this.IsFourEyesEnabled && this.IsReauthenticationRequired) {
      this._credentialType = ValidationCredentialType.Both;
    } else if (this.IsReauthenticationRequired) {
      this._credentialType = ValidationCredentialType.UserAuthentication;
    } else if (this.IsFourEyesEnabled) {
      this._credentialType = ValidationCredentialType.SupervisorAuthentication;
    }
  }
}
