import { Injectable, Optional } from '@angular/core';
import { SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, ConnectableObservable, Observable } from 'rxjs';
import { publish, tap } from 'rxjs/operators';

import { MultiMonitorServiceBase } from '../shared';
import { TraceModules } from '../shared/trace-modules';
import { CnsLocation } from '../wsi-proxy-api/system-browser/cns-location.model';
import { BrowserObject, ViewType, ViewTypeConverter } from '../wsi-proxy-api/system-browser/data.model';
import { Designation } from '../wsi-proxy-api/system-browser/designation.model';
import { CnsFormatOption, CnsLabel, CnsLabelEn, ViewInfo } from './cns-helper.model';

const gmsServicesCnsDescriptionResxKey = 'GMS_SERVICES.CNS_DESCRIPTION';
const gmsServicesCnsNameResxKey = 'GMS_SERVICES.CNS_NAME';
const gmsServicesCnsAliasResxKey = 'GMS_SERVICES.CNS_ALIAS';

// @dynamic
@Injectable({
  providedIn: 'root'
})
export class CnsHelperService {

  public constructor(private readonly translateService: TranslateService,
    private readonly trace: TraceService,
    private readonly multiMonitorService: MultiMonitorServiceBase,
    @Optional() private readonly settings: SettingsServiceBase) {

    this.trace.info(TraceModules.cnsHelper, 'CnsHelperService created.');
    this._activeView = new BehaviorSubject<ViewInfo>(null!);
  }

  public get activeCnsLabel(): Observable<CnsLabel> {

    if (this.cnsLabels === null) {
      this.initializeCnsLabel();
    }
    if (!this._activeCnsLabel) {
      this._activeCnsLabel = new BehaviorSubject<CnsLabel>(null!);
      this.connectableObservable = this.activeCnsLabel.pipe(publish()) as ConnectableObservable<CnsLabel>;
      this.connectableObservable.connect();
      if (this.settings != null) {
        this.settings.getSettings(this.settingsCnsId).subscribe(
          val => this.onGetCnsSettings(val),
          err => this.onGetCnsSettingsError(err)
        );
      } else {
        this._activeCnsLabel.next(this.cnsLabels[2]);
      }
    }
    return this._activeCnsLabel.asObservable();
  }

  public get activeCnsLabelValue(): CnsLabel {
    return this._activeCnsLabel ? this._activeCnsLabel.getValue() : null!;
  }

  public get activeView(): Observable<ViewInfo> {
    return this._activeView
      .pipe(
        tap(vi => {
          if (!vi) {
            this.trace.warn(TraceModules.cnsHelper, 'Active view subscription requested prior to property initialization.');
          }
        }));
  }

  public get activeViewValue(): ViewInfo {
    return this._activeView.getValue();
  }

  /**
   * All possible CNS label settings
   *
   * @type {CnsLabel[]}
   * @memberof CnsHelperService
   */
  public cnsLabels: CnsLabel[] = null!;

  private connectableObservable!: ConnectableObservable<CnsLabel>;

  private _activeCnsLabel!: BehaviorSubject<CnsLabel>;

  private readonly settingsCnsId = 'CnsLabelSettings';

  private readonly _activeView: BehaviorSubject<ViewInfo>;

  /**
   * Compare two CNS View Types based on priority of the View Type
   * Return a numerical value indicating results
   *  if a < b, return -value
   *  if a == b, return 0
   *  if a > b, return +value
   */
  public static compareViewTypes(a: ViewType, b: ViewType): number {

    if (a === b) {
      return 0;
    } else {
      const orderA: number = CnsHelperService.getViewTypeSortOrder(a);
      const orderB: number = CnsHelperService.getViewTypeSortOrder(b);

      if (orderA == undefined) {
        return 1;
      } else if (orderB == undefined) {
        return -1;
      } else {
        return orderA < orderB ? -1 : 1;
      }
    }
  }

  /**
   * Compare two BrowserObject based on view type and then by designation
   * Return a numerical value indicating results
   *  if a < b, return -value
   *  if a == b, return 0
   *  if a > b, return +value
   */
  public static compareBrowserObjects(a: BrowserObject, b: BrowserObject): number {
    const viewTypeA: ViewType = a ? ViewTypeConverter!.toViewType(a.ViewType)! : undefined!;
    const viewTypeB: ViewType = b ? ViewTypeConverter!.toViewType(b.ViewType)! : undefined!;

    const viewTypeComparison: number = CnsHelperService.compareViewTypes(viewTypeA, viewTypeB);

    if (viewTypeComparison === 0) {
      const designationA: string = a ? a.Designation : undefined!;
      const designationB: string = b ? b.Designation : undefined!;

      if (designationA === designationB) {
        return 0;
      } else if (designationA == undefined) {
        return 1;
      } else if (designationB == undefined) {
        return -1;
      } else {
        return designationA < designationB ? -1 : 1;
      }
    }

    return viewTypeComparison;
  }

  /**
   * Returns a ViewType's sort order (User, Logical, Physical, Application, Management)
   */
  private static getViewTypeSortOrder(viewType: ViewType): number {
    let sortOrder: number;

    switch (viewType) {
      case ViewType.User:
        sortOrder = 1;
        break;
      case ViewType.Logical:
        sortOrder = 2;
        break;
      case ViewType.Physical:
        sortOrder = 3;
        break;
      case ViewType.Application:
        sortOrder = 4;
        break;
      case ViewType.Management:
        sortOrder = 5;
        break;
      default:
        break;
    }

    return sortOrder!;
  }

  /**
   * Notifies and synchronizes the state of Electron windows in a multi-monitor configuration
   * with the active view information.
   *
   * @param {ViewInfo} activeViewValue - The current active view information, which includes details about
   * the view being displayed and its associated CNS views.
   */
  public notifyElectronWindows(activeViewValue: ViewInfo): void {
    // Check if the application is running in an Electron environment
    // and if the current window is the main event-manager window.
    if (this.multiMonitorService.runsInElectron &&
      this.multiMonitorService.isMainManager()) {

      // Prepare the object for serialization, containing the active view information
      // and its corresponding CNS views.
      const activeViewValueForSerialization = {
        activeViewValue,
        cnsViews: activeViewValue.cnsViews
      };

      // Serialize the active view object into a JSON string to be sent across Electron windows.
      const activeViewValueSerialized = JSON.stringify(activeViewValueForSerialization);

      // Synchronize the UI state across different windows in the Electron app.
      // The state is sent to all other windows except the current one (`sendToItself: false`).
      this.multiMonitorService.synchronizeUiState({
        sendToItself: false,
        state: { activeView: activeViewValueSerialized }
      });
    }
  }

  /**
   * Formats the browser node labels based on the member field _activeCnsLabel.
   * Example:
   *
   * _activeCnsLabel = CnsLabelEn.DescriptionAndName => the returned formatted string is: 'node.Descriptor [node.Name]'
   *
   * @param {BrowserObject} node the browser node
   * @returns {string} the string formatted browser node
   * @memberof CnsHelperService
   */
  public formatCnsLabel(node: BrowserObject): string {
    const cnsLabelSetting: CnsLabel = this.activeCnsLabelValue;
    if (!node) {
      return undefined!;
    } else if (!cnsLabelSetting) {
      return `${node.Descriptor} [${node.Name}]`;
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.Description) {
      return node.Descriptor;
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.Name) {
      return node.Name;
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.DescriptionAndName) {
      return `${node.Descriptor} [${node.Name}]`;
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.NameAndDescription) {
      return `${node.Name} [${node.Descriptor}]`;
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.DescriptionAndAlias) {
      return `${node.Descriptor} [${node.Attributes.Alias}]`;
    } else {
      return `${node.Name} [${node.Attributes.Alias}]`;
    }
  }

  /**
   * Orders the browser node labels based on the member field _activeCnsLabel.
   * Example:
   *
   * _activeCnsLabel = CnsLabelEn.DescriptionAndName => the returned string array is: [ node.Descriptor, node.Name ]
   *
   * @param {BrowserObject} node the browser node
   * @returns {string} the string formatted browser node
   * @returns {string[]}
   * @memberof CnsHelperService
   */
  public getCnsLabelsOrdered(node: BrowserObject): string[] {
    const cnsLabelSetting: CnsLabel = this.activeCnsLabelValue;
    if (!node) {
      return undefined!;
    } else if (!cnsLabelSetting) {
      return [node.Descriptor, node.Name];
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.Description) {
      return [node.Descriptor];
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.Name) {
      return [node.Name];
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.DescriptionAndName) {
      return [node.Descriptor, node.Name];
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.NameAndDescription) {
      return [node.Name, node.Descriptor];
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.DescriptionAndAlias) {
      return [node.Descriptor, node.Attributes.Alias];
    } else {
      return [node.Name, node.Attributes.Alias];
    }
  }

  /**
   * Sets the active CNS (Control and Navigation System) label to the provided CnsLabel object.
   *
   * This method ensures that an active CNS label observable is created if it doesn't already exist,
   * updates the active label, and saves the CNS settings if applicable.
   *
   * @param {CnsLabel} label - The CnsLabel object representing the new CNS label that is being set.
   */
  public setActiveCnsLabel(label: CnsLabel): void {
    // Check if the active CNS label BehaviorSubject is not initialized yet.
    // If it doesn't exist, initialize it with a null value and set up a connectable observable.
    if (!this._activeCnsLabel) {
      // Create a new BehaviorSubject to hold the active CNS label.
      this._activeCnsLabel = new BehaviorSubject<CnsLabel>(null!);

      // Create a connectable observable from the CNS label observable using the `publish` operator.
      // This allows multiple subscribers to receive updates.
      this.connectableObservable = this.activeCnsLabel.pipe(publish()) as ConnectableObservable<CnsLabel>;

      // Immediately connect the observable to start emitting values.
      this.connectableObservable.connect();
    }

    // Push the new CNS label to the BehaviorSubject, updating its value.
    this._activeCnsLabel.next(label);

    // If the settings object exists (is not null), save the new CNS label in the settings.
    if (this.settings != null) {
      this.saveCnsSettings(label);
    }
  }

  /**
   * Sets the active view to the provided ViewInfo object.
   *
   * This method ensures that the new active view is valid, checks for changes
   * against the current active view, and handles synchronization with other
   * Electron windows if applicable.
   *
   * @param {ViewInfo} vi - The ViewInfo object representing the new active view
   * information that is being set.
   */
  public setActiveView(vi: ViewInfo): void {
    // Check if the provided ViewInfo object is valid.
    // If 'vi' is null or undefined, return immediately and ignore the call.
    if (!vi) {
      return; // ignore invalid argument
    }

    // If running in an Electron environment, and the current window is not the main
    // manager but an event manager, check if the new view is already the active one.
    if (this.multiMonitorService.runsInElectron &&
      !this.multiMonitorService.isMainManager() &&
      this.multiMonitorService.isManagerWithEvent()) {

      // If the new view is the same as the currently active one, exit early.
      if (vi === this.activeViewValue) {
        return;
      }

    } else {
      // For other environments or the main manager, check if the new view is
      // equal to the current one. If so, return early to avoid redundant updates.
      if (vi.isEqual(this.activeViewValue)) {
        return;
      }
    }

    // Log a message that the active view has changed for debugging purposes.
    this.trace.debug(TraceModules.cnsHelper, 'Active view changed: viewInfo=%s', vi.toString());

    // Update the active view by pushing the new value into the observable stream.
    this._activeView.next(vi);

    // If running in an Electron environment and the current window is the main
    // manager, notify the other Electron windows about the change in the active view.
    if (this.multiMonitorService.runsInElectron &&
      this.multiMonitorService.isMainManager()) {
      this.notifyElectronWindows(vi);
    }
  }

  /**
   * Formats the browser object according to the formatOption and the active cnsLabel value.
   *
   * If the _activeCnsLabel is set to 'CnsLabelEn.Description' the returned string is:
   * CnsFormatOption.Long => 'Location'; e.g. 'System1.View 1:Root Node.Node 1.Node 2'
   * CnsFormatOption.Short => 'Descriptor'; e.g. 'Node 2'
   * CnsFormatOption.LongExcludeSystemName => 'Location without Systemname'; e.g. 'View 1:Root Node.Node 1.Node 2'
   * CnsFormatOption.LongExcludeViewName => 'Location without Viewname'; e.g. 'Root Node.Node 1.Node 2'
   *
   * If the _activeCnsLabel is set to 'CnsLabelEn.Name' the returned string is:
   * CnsFormatOption.Long => 'Designation'; e.g. 'System1.View1:RootNode.Node1.Node2'
   * CnsFormatOption.Short => 'Name'; e.g. 'Node2'
   * CnsFormatOption.LongExcludeSystemName => 'Designation without Systemname'; e.g. 'View1:RootNode.Node1.Node2'
   * CnsFormatOption.LongExcludeViewName => 'Designation without Viewname'; e.g. 'RootNode.Node1.Node2'
   *
   * If the _activeCnsLabel is set to 'CnsLabelEn.DescriptionAndName' the returned string is:
   * CnsFormatOption.Long => 'Location [Name]'; e.g. 'System1.View 1:Root Node.Node 1.Node 2 [Node2]'
   * CnsFormatOption.Short => 'Descriptor [Name]'; e.g. 'Node 2 [Node2]'
   * CnsFormatOption.LongExcludeSystemName => 'Location without Systemname [Name]'; e.g. 'View 1:Root Node.Node 1.Node 2 [Node2]'
   * CnsFormatOption.LongExcludeViewName => 'Location without Viewname [Name]'; e.g. 'Root Node.Node 1.Node 2 [Node2]'
   *
   * If the _activeCnsLabel is set to 'CnsLabelEn.NameAndDescription' the returned string is:
   * CnsFormatOption.Long => 'Designation [Descriptor]'; e.g. 'System1.View1:RootNode.Node1.Node2 [Node 2]'
   * CnsFormatOption.Short => 'Name [Descriptor]'; e.g. 'Node2 [Node 2]'
   * CnsFormatOption.LongExcludeSystemName => 'Designation without Systemname [Descriptor]'; e.g. 'View1:RootNode.Node1.Node2 [Node 2]'
   * CnsFormatOption.LongExcludeViewName => 'Designation without Viewname [Descriptor]'; e.g. 'RootNode.Node1.Node2 [Node 2]'
   *
   * If the _activeCnsLabel is set to 'CnsLabelEn.DescriptionAndAlias' the returned string is:
   * CnsFormatOption.Long => 'Location [Alias]'; e.g. 'System1.View 1:Root Node.Node 1.Node 2 [AnyAlias]'
   * CnsFormatOption.Short => 'Descriptor [Alias]'; e.g. 'Node 2 [AnyAlias]'
   * CnsFormatOption.LongExcludeSystemName => 'Location without Systemname [Alias]'; e.g. 'View 1:Root Node.Node 1.Node 2 [AnyAlias]'
   * CnsFormatOption.LongExcludeViewName => 'Location without Viewname [Alias]'; e.g. 'Root Node.Node 1.Node 2 [AnyAlias]'
   *
   * If the _activeCnsLabel is set to 'CnsLabelEn.NameAndAlias' the returned string is:
   * CnsFormatOption.Long => 'Designation [Alias]'; e.g. 'System1.View1:RootNode.Node1.Node2 [AnyAlias]'
   * CnsFormatOption.Short => 'Name [Alias]'; e.g. 'Node2 [AnyAlias]'
   * CnsFormatOption.LongExcludeSystemName => 'Designation without Systemname [Alias]'; e.g. 'View1:RootNode.Node1.Node2 [AnyAlias]'
   * CnsFormatOption.LongExcludeViewName => 'Designation without Viewname [Alias]'; e.g. 'RootNode.Node1.Node2 [AnyAlias]'
   *
   * @param {BrowserObject } node the browser object whose data have to be formatted.
   * @param {CnsFormatOption } formatOption
   * @returns {string}
   * @memberof CnsHelperService
   */
  public formatBrowserObject(node: BrowserObject, formatOption: CnsFormatOption): string {
    const cnsLabelSetting: CnsLabel = this.activeCnsLabelValue;
    if (!node) {
      return undefined!;
    } else if (!cnsLabelSetting) {
      return this.formatBrowserObjectForDescriptionAndName(node, formatOption);
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.Description) {
      return this.formatBrowserObjectForDescription(node, formatOption);
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.Name) {
      return this.formatBrowserObjectForName(node, formatOption);
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.DescriptionAndName) {
      return this.formatBrowserObjectForDescriptionAndName(node, formatOption);
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.NameAndDescription) {
      return this.formatBrowserObjectForNameAndDescription(node, formatOption);
    } else if (cnsLabelSetting.cnsLabel === CnsLabelEn.DescriptionAndAlias) {
      return this.formatBrowserObjectForDescriptionAndAlias(node, formatOption);
    } else {
      return this.formatBrowserObjectForNameAndAlias(node, formatOption);
    }
  }

  private traceNotHandledEnumValue(): void {
    this.trace.error(TraceModules.cnsHelper, 'The enumeration value is not handled. Fallback to default.');
  }

  private formatBrowserObjectForDescription(node: BrowserObject, formatOption: CnsFormatOption): string {
    if (formatOption === CnsFormatOption.Short) {
      return node.Descriptor;
    } else if (formatOption === CnsFormatOption.Long) {
      return node.Location;
    } else if (formatOption === CnsFormatOption.LongExcludeSystemName) {
      return (new CnsLocation(node.Location)).locationWoSystem!;
    } else if (formatOption === CnsFormatOption.LongExcludeViewName) {
      return (new CnsLocation(node.Location)).locationWoSystemView!;
    } else {
      this.traceNotHandledEnumValue();
      return node.Descriptor;
    }
  }

  private formatBrowserObjectForName(node: BrowserObject, formatOption: CnsFormatOption): string {
    if (formatOption === CnsFormatOption.Short) {
      return node.Name;
    } else if (formatOption === CnsFormatOption.Long) {
      return node.Designation;
    } else if (formatOption === CnsFormatOption.LongExcludeSystemName) {
      return (new Designation(node.Designation)).designationWoSystem!;
    } else if (formatOption === CnsFormatOption.LongExcludeViewName) {
      return (new Designation(node.Designation)).designationWoSystemView!;
    } else {
      this.traceNotHandledEnumValue();
      return node.Name;
    }
  }

  private formatBrowserObjectForDescriptionAndName(node: BrowserObject, formatOption: CnsFormatOption): string {
    if (formatOption === CnsFormatOption.Short) {
      return `${node.Descriptor} [${node.Name}]`;
    } else if (formatOption === CnsFormatOption.Long) {
      return `${node.Location}`;
    } else if (formatOption === CnsFormatOption.LongExcludeSystemName) {
      return `${(new CnsLocation(node.Location)).locationWoSystem} [${node.Name}]`;
    } else if (formatOption === CnsFormatOption.LongExcludeViewName) {
      return `${(new CnsLocation(node.Location)).locationWoSystemView} [${node.Name}]`;
    } else {
      this.traceNotHandledEnumValue();
      return `${node.Descriptor} [${node.Name}]`;
    }
  }

  private formatBrowserObjectForNameAndDescription(node: BrowserObject, formatOption: CnsFormatOption): string {
    if (formatOption === CnsFormatOption.Short) {
      return `${node.Name} [${node.Descriptor}]`;
    } else if (formatOption === CnsFormatOption.Long) {
      return `${node.Designation}`;
    } else if (formatOption === CnsFormatOption.LongExcludeSystemName) {
      return `${(new Designation(node.Designation)).designationWoSystem} [${node.Descriptor}]`;
    } else if (formatOption === CnsFormatOption.LongExcludeViewName) {
      return `${(new Designation(node.Designation)).designationWoSystemView} [${node.Descriptor}]`;
    } else {
      this.traceNotHandledEnumValue();
      return `${node.Name} [${node.Descriptor}]`;
    }
  }

  private formatBrowserObjectForDescriptionAndAlias(node: BrowserObject, formatOption: CnsFormatOption): string {
    if (formatOption === CnsFormatOption.Short) {
      if (node.Attributes.Alias != null) {
        return `${node.Descriptor} [${node.Attributes.Alias}]`;
      } else {
        return `${node.Descriptor}`;
      }
    } else if (formatOption === CnsFormatOption.Long) {
      return `${node.Location}`;
    } else if (formatOption === CnsFormatOption.LongExcludeSystemName) {
      if (node.Attributes.Alias != null) {
        return `${(new CnsLocation(node.Location)).locationWoSystem} [${node.Attributes.Alias}]`;
      } else {
        return `${(new CnsLocation(node.Location)).locationWoSystem}`;
      }
    } else if (formatOption === CnsFormatOption.LongExcludeViewName) {
      if (node.Attributes.Alias != null) {
        return `${(new CnsLocation(node.Location)).locationWoSystemView} [${node.Attributes.Alias}]`;
      } else {
        return `${(new CnsLocation(node.Location)).locationWoSystemView}`;
      }
    } else {
      this.traceNotHandledEnumValue();
      if (node.Attributes.Alias != null) {
        return `${node.Descriptor} [${node.Attributes.Alias}]`;
      } else {
        return `${node.Descriptor}`;
      }
    }
  }

  private formatBrowserObjectForNameAndAlias(node: BrowserObject, formatOption: CnsFormatOption): string {
    if (formatOption === CnsFormatOption.Short) {
      if (node.Attributes.Alias != null) {
        return `${node.Name} [${node.Attributes.Alias}]`;
      } else {
        return `${node.Name}`;
      }
    } else if (formatOption === CnsFormatOption.Long) {
      return `${node.Designation}`;
    } else if (formatOption === CnsFormatOption.LongExcludeSystemName) {
      if (node.Attributes.Alias != null) {
        return `${(new Designation(node.Designation)).designationWoSystem} [${node.Attributes.Alias}]`;
      } else {
        return `${(new Designation(node.Designation)).designationWoSystem}`;
      }
    } else if (formatOption === CnsFormatOption.LongExcludeViewName) {
      if (node.Attributes.Alias != null) {
        return `${(new Designation(node.Designation)).designationWoSystemView} [${node.Attributes.Alias}]`;
      } else {
        return `${(new Designation(node.Designation)).designationWoSystemView}`;
      }
    } else {
      this.traceNotHandledEnumValue();
      if (node.Attributes.Alias != null) {
        return `${node.Name} [${node.Attributes.Alias}]`;
      } else {
        return `${node.Name}`;
      }
    }
  }

  private initializeCnsLabel(): void {
    this.cnsLabels = [
      new CnsLabel(CnsLabelEn.Description, this.translateService.get(gmsServicesCnsDescriptionResxKey)),
      new CnsLabel(CnsLabelEn.Name, this.translateService.get(gmsServicesCnsNameResxKey)),
      new CnsLabel(CnsLabelEn.DescriptionAndName, this.translateService.get(gmsServicesCnsDescriptionResxKey),
        this.translateService.get(gmsServicesCnsNameResxKey)),
      new CnsLabel(CnsLabelEn.NameAndDescription, this.translateService.get(gmsServicesCnsNameResxKey),
        this.translateService.get(gmsServicesCnsDescriptionResxKey)),
      new CnsLabel(CnsLabelEn.DescriptionAndAlias, this.translateService.get(gmsServicesCnsDescriptionResxKey),
        this.translateService.get(gmsServicesCnsAliasResxKey)),
      new CnsLabel(CnsLabelEn.NameAndAlias, this.translateService.get(gmsServicesCnsNameResxKey),
        this.translateService.get(gmsServicesCnsAliasResxKey))];

    this.translateService.onLangChange.subscribe((_event: LangChangeEvent) => {
      this.cnsLabels = [
        new CnsLabel(CnsLabelEn.Description, this.translateService.get(gmsServicesCnsDescriptionResxKey)),
        new CnsLabel(CnsLabelEn.Name, this.translateService.get(gmsServicesCnsNameResxKey)),
        new CnsLabel(CnsLabelEn.DescriptionAndName, this.translateService.get(gmsServicesCnsDescriptionResxKey),
          this.translateService.get(gmsServicesCnsNameResxKey)),
        new CnsLabel(CnsLabelEn.NameAndDescription, this.translateService.get(gmsServicesCnsNameResxKey),
          this.translateService.get(gmsServicesCnsDescriptionResxKey)),
        new CnsLabel(CnsLabelEn.DescriptionAndAlias, this.translateService.get(gmsServicesCnsDescriptionResxKey),
          this.translateService.get(gmsServicesCnsAliasResxKey)),
        new CnsLabel(CnsLabelEn.NameAndAlias, this.translateService.get(gmsServicesCnsNameResxKey),
          this.translateService.get(gmsServicesCnsAliasResxKey))];
    });
  }

  private onGetCnsSettings(settings: string): void {
    const labelIndex: number = parseInt(settings, 10); // 10 is the radix
    if (labelIndex != null && labelIndex >= 0 && labelIndex < this.cnsLabels.length) {
      this._activeCnsLabel.next(this.cnsLabels[labelIndex]);
    } else {
      // set factory value.
      this._activeCnsLabel.next(this.cnsLabels[2]);
    }
  }

  private onGetCnsSettingsError(error: any): void {
    this.trace.error(TraceModules.cnsHelper, 'Error getting CnsSettings:' + error);
    this.trace.info(TraceModules.cnsHelper, 'Select');
    this._activeCnsLabel.next(this.cnsLabels[2]);
  }

  private saveCnsSettings(cnsLabel: CnsLabel): void {
    const settings: string = cnsLabel.cnsLabel.toString();
    this.settings.putSettings(this.settingsCnsId, settings).subscribe(
      val => this.onPutSettings(val),
      err => this.trace.error(TraceModules.cnsHelper, 'CnsSettings saving error:' + err)
    );
  }

  private onPutSettings(isSuccess: boolean): void {
    this.trace.info(TraceModules.cnsHelper, 'CnsSettings saving completed. result: %s', isSuccess);
  }

}
