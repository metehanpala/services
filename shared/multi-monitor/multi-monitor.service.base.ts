import { Observable } from 'rxjs';

import { BrowserObject } from '../../wsi-proxy-api/system-browser/data.model';
import { ManagerInfo, MultiMonitorConfigurationInfo } from './multi-monitor-configuration.data';

export abstract class MultiMonitorServiceBase {

  public abstract get runsInElectron(): boolean;

  public abstract isMainManager(): boolean | undefined;

  public abstract isSingleSystemManager(): Promise<boolean | undefined>;

  public abstract onCurrentMultiMonitorConfigurationChanged(): Observable<MultiMonitorConfigurationInfo>;

  public abstract onCurrentManagerConfigurationChanged(): Observable<ManagerInfo>;

  public abstract isManagerWithEvent(): boolean | undefined;

  public abstract saveCurrentConfigurationAsDefault(overruleAllowed: boolean): void;

  public abstract sendObjectToWindow(objectToSend: any): void;

  public abstract sendObjectToMainManager(objectToSend: any): void;

  public abstract sendObjectToAllWindows(objectToSend: any): void;

  public abstract sendObject(webContentsId: number, data: any): void;

  public abstract sendEvent(eventToSend: any): void;

  public abstract resetToDefaultConfiguration(): Promise<boolean>;

  public abstract synchronizeUiState(state: any): void;

  public abstract isCurrentMultiMonitorConfigurationChangeAllowed(): boolean | undefined;

  public abstract synchronizeWithUserSettings(): boolean;

  public abstract startAdditionalSystemManager(): void;

  public abstract detachEventManager(initialUrl?: string): void;

  public abstract resumeEventManager(initialUrl?: string): void;

  public abstract isDefaultMultiMonitorConfigurationChangeAllowed(): boolean | undefined;

  public abstract setStartupNode(designation: string): void;

  public abstract getStartupNode(): string | undefined;

  public abstract setActiveLayout(frameId: string, viewId: string, layoutId: string): void;

  public abstract getActiveLayout(frameId: string, viewId: string): string | undefined;

  public abstract matchCommunicationRules(node: BrowserObject): number | undefined;
}
