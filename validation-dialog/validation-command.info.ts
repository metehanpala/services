/**
 * @param: objectOrPropertyIds - This parameter could be an array of object ids or property ids.
 *
 */
export class ValidationCommandInfo {
  private readonly _propertyIds: string[];

  public get PropertyIds(): string[] {
    return this._propertyIds;
  }

  private readonly _cmdGroup: number;

  public get CmdGroup(): number {
    return this._cmdGroup;
  }

  constructor(propertyIds: string[], cmdGroup: number) {
    this._propertyIds = propertyIds;
    this._cmdGroup = cmdGroup;
  }
}
