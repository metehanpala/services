import { BrowserObject } from '../../wsi-proxy-api/system-browser/data.model';

export const gmsNoSelectionMessageType = 'GmsNoSelection';

export enum GmsSelectionType {
  None,
  Cns,
  Object
}

export class GmsMessageData {
  public customData: any;
  public constructor(public data: BrowserObject[],
    public selectionType: GmsSelectionType = GmsSelectionType.Cns) {

  }
}
