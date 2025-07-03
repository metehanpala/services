export class DpIdentifier {

  public static readonly systemNameSeparator: string = ':';
  public static readonly propertyNameSeparator: string = '.';

  private _systemName = '';
  private _objectIdWoSys = '';
  private _objectId = '';
  private _propertyName = '';

  constructor(public objectOrPropertyId: string) {
    this.init(objectOrPropertyId);
  }

  public get systemName(): string {
    return this._systemName;
  }

  public get objectIdWoSystem(): string {
    return this._objectIdWoSys;
  }

  public get objectId(): string {
    return this._objectId;
  }

  public get propertName(): string {
    return this._propertyName;
  }

  public get isProperty(): boolean {
    return (this._propertyName !== '') ? true : false;
  }

  private init(objectOrPropertyId: string): void {
    const idxSys: number = objectOrPropertyId.indexOf(DpIdentifier.systemNameSeparator);
    const idxProp: number = objectOrPropertyId.indexOf(DpIdentifier.propertyNameSeparator);
    if (idxSys !== -1) {
      this._systemName = objectOrPropertyId.substring(0, idxSys);
    }
    if (idxProp !== -1) {
      this._propertyName = objectOrPropertyId.substring(idxProp + 1, objectOrPropertyId.length);
    }

    if ((idxSys !== -1) && (idxProp !== -1)) {
      this._objectIdWoSys = objectOrPropertyId.substring(idxSys + 1, idxProp);
      this._objectId = objectOrPropertyId.substring(0, idxProp);
    } else if ((idxSys === -1) && (idxProp !== -1)) {
      this._objectIdWoSys = objectOrPropertyId.substring(0, idxProp);
      this._objectId = objectOrPropertyId.substring(0, idxProp);
    } else if ((idxSys !== -1) && (idxProp === -1)) {
      this._objectIdWoSys = objectOrPropertyId.substring(idxSys + 1, objectOrPropertyId.length);
      this._objectId = objectOrPropertyId;
    } else if ((idxSys === -1) && (idxProp === -1)) {
      this._objectIdWoSys = objectOrPropertyId;
      this._objectId = objectOrPropertyId;
    }
  }
}
