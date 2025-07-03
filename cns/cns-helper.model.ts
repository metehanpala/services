import { Observable } from 'rxjs';

import { BrowserObject, ViewNode, ViewType, ViewTypeConverter } from '../wsi-proxy-api/system-browser/data.model';
import { Designation } from '../wsi-proxy-api/system-browser/designation.model';

export enum CnsLabelEn {
  Description,
  Name,
  DescriptionAndName,
  NameAndDescription,
  DescriptionAndAlias,
  NameAndAlias
}

export class CnsLabel {
  public constructor(
    public cnsLabel: CnsLabelEn = CnsLabelEn.Description,
    public displayValue: Observable<string> | null = null,
    public secondaryDisplayValue: Observable<string> | null = null) {
  }
}

export enum CnsFormatOption {
  Short,
  Long,
  LongExcludeSystemName,
  LongExcludeViewName
}

export class CnsViewId {
  public readonly systemId: number;
  public readonly viewId: number;
  public readonly systemName: string;
  public readonly viewName: string;

  public static compare(a: CnsViewId, b: CnsViewId): number {
    if (!a) {
      return !b ? 0 : -1;
    }
    if (!b) {
      return 1;
    }
    let res: number = a.systemId - b.systemId;
    if (res === 0) {
      res = a.viewId - b.viewId;
    }
    return res;
  }

  public static isEqual(a: CnsViewId, b: CnsViewId): boolean {
    if (a === b) {
      return true; // same object (or both undefined)
    }
    if (!a || !b) {
      return false; // one object is undefined
    }
    return a.systemId === b.systemId &&
      a.viewId === b.viewId &&
      a.systemName === b.systemName &&
      a.viewName === b.viewName;
  }

  public constructor(cnsView: ViewNode) {
    if (!cnsView || isNaN(cnsView.SystemId) || isNaN(cnsView.ViewId)) {
      throw new Error('invalid cns-view');
    }
    this.systemId = cnsView.SystemId;
    this.viewId = cnsView.ViewId;
    this.systemName = cnsView.SystemName;
    this.viewName = cnsView.Name;
  }

  public toString(): string {
    return `{name=${this.systemName}.${this.viewName}, sysId=${this.systemId}, viewId=${this.viewId}}`;
  }

  public containsDesignationString(dStr: string): boolean {
    if (!dStr) {
      return false;
    }
    return this.containsDesignation(new Designation(dStr));
  }

  public containsDesignation(d: Designation): boolean {
    if (!(d?.isSystemValid && d?.isViewValid)) {
      return false;
    }
    return this.systemName === d.systemName && this.viewName === d.viewName;
  }

  public containsObject(bo: BrowserObject): boolean {
    if (!bo) {
      return false;
    }
    if (isNaN(bo.SystemId) || isNaN(bo.ViewId)) {
      return this.containsDesignationString(bo.Designation);
    } else {
      return this.systemId === bo.SystemId && this.viewId === bo.ViewId;
    }
  }

  public isViewNodeMatch(cnsView: ViewNode): boolean {
    if (!cnsView) {
      return false;
    }
    return this.systemId === cnsView.SystemId && this.viewId === cnsView.ViewId;
  }

  public isEqual(that: CnsViewId): boolean {
    return CnsViewId.isEqual(this, that);
  }
}

export class ViewInfo {
  public readonly description: string;
  public readonly viewType: ViewType | undefined;
  private readonly cnsViewArr: CnsViewId[] = [];

  public get cnsViews(): readonly CnsViewId[] {
    return this.cnsViewArr;
  }

  public static isEqual(a: ViewInfo, b: ViewInfo): boolean {
    if (a === b) {
      return true; // same object (or both undefined)
    }
    if (!a || !b) {
      return false; // one object is undefined
    }
    return a.viewType === b.viewType &&
      a.description === b.description &&
      a.cnsViews.length === b.cnsViews.length &&
      a.cnsViews.every((v, idx) => v.isEqual(b.cnsViews[idx])); // works because arrays are sorted in c'tor!
  }

  public constructor(viewNodeArr: ViewNode[]) {
    if (!(viewNodeArr && viewNodeArr.length > 0)) {
      throw new Error('invalid argument');
    }
    this.description = viewNodeArr[0].Descriptor;
    const typeNum: number = viewNodeArr[0].ViewType;
    if (viewNodeArr.some(v => v.Descriptor !== this.description) || viewNodeArr.some(v => v.ViewType !== typeNum)) {
      throw new Error('incompatible cns-views');
    }
    this.viewType = ViewTypeConverter.toViewType(typeNum);
    this.cnsViewArr = viewNodeArr.map(v => new CnsViewId(v));
    // Sorting makes deep equality comparison of ViewInfo objects easier
    this.cnsViewArr.sort((a, b) => CnsViewId.compare(a, b));
  }

  public toString(): string {
    return `{description=${this.description}, type=${this.viewType}, cnsViews=[${this.cnsViewArr}]}`;
  }

  public containsDesignationString(dStr: string): boolean {
    if (!dStr) {
      return false;
    }
    return this.containsDesignation(new Designation(dStr));
  }

  public containsDesignation(d: Designation): boolean {
    return this.cnsViews.some(vid => vid.containsDesignation(d));
  }

  public containsObject(bo: BrowserObject): boolean {
    return this.cnsViews.some(vid => vid.containsObject(bo));
  }

  public containsViewNode(cnsView: ViewNode): boolean {
    return this.cnsViews.some(vid => vid.isViewNodeMatch(cnsView));
  }

  public isEqual(that: ViewInfo): boolean {
    return ViewInfo.isEqual(this, that);
  }
}
