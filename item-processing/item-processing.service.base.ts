import { BrowserObject } from '../wsi-proxy-api/system-browser';
import { PossibleActions } from './data.model';

export abstract class ItemProcessingServiceBase {
  public abstract getPossibleActions(node: BrowserObject, reference: string, parameter?: string): Promise<PossibleActions>;

  public abstract openInNewTab(node: BrowserObject, reference: string, parameter?: string): void;
}
