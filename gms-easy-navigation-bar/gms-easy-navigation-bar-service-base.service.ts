import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export abstract class GmsEasyNavigationBarServiceBase {
  protected _easyNavigationBarViewName = '';
  protected _hldlEasyNavigationBarViewName = '';
  public onEasyNavigationBarUpdate: Subject<string> = new Subject<string>();
  protected abstract onGetEasyNavigationBarSettings(settings?: any): void;
  protected abstract onGetEasyNavigationBarSettingsError(error: any): void;
  public abstract get EasyNavigationBarViewSettingId(): string;
  public abstract get EasyNavigationBarViewName(): string;
  public abstract set EasyNavigationBarViewName(value: string);
  public abstract get HldlEasyNavigationBarViewName(): string;
  public abstract set HldlEasyNavigationBarViewName(value: string);
  public abstract get SelectedViewActivated(): boolean;
  protected abstract set SelectedViewActivated(value: boolean);
  public abstract get SelectedView(): any;
  public abstract get snapinVm(): any;
  public abstract set snapinVm(newVm: any);
  public abstract getEasyNavigationSettings(): void;
  public abstract putEasyNavigationSettings(): void;
  public abstract saveAndUpdateSelectedView(view: string): void;
  public abstract updateSelectedView(): void;
  public abstract initViewNames(): void;
  public abstract get Views(): string[];
}
