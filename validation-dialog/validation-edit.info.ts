export class ValidationEditInfo {
  private readonly _objectIds: string[];

  public get ObjectIds(): string[] {
    return this._objectIds;
  }

  constructor(public objectIds: string[]) {
    this._objectIds = objectIds;
  }
}
