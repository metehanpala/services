import { BrowserObject, ViewNode, ViewType, ViewTypeConverter } from '../wsi-proxy-api/system-browser/data.model';
import { CnsViewId, ViewInfo } from './cns-helper.model';

/* eslint-disable @typescript-eslint/naming-convention */

const baseViewNode: ViewNode = Object.freeze({
  Designation: 'SystemA.LogicalView',
  Name: 'LogicalView',
  Descriptor: 'Logical View',
  SystemName: 'SystemA',
  SystemId: 5,
  ViewId: 8,
  ViewType: 2 // WSI value for "logical" view-type
});

const baseBrowserObject: BrowserObject = Object.freeze({
  Designation: 'SystemA.LogicalView:Campus.Bldg1000.OAT',
  Name: 'OAT',
  Location: 'SystemA.Logical View:Campus.Building 1000.Outside Air Temp',
  Descriptor: 'Outside Air Temp',
  ObjectId: 'SystemA:OAT1000',
  SystemId: 5,
  ViewId: 8,
  ViewType: 0,
  HasChild: true,
  Attributes: undefined
} as unknown as BrowserObject);

/* eslint-enable @typescript-eslint/naming-convention */

describe('CnsHelperService data model', () => {

  it('CnsViewId #ctor', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    expect(vid.systemId).toBe(v.SystemId);
    expect(vid.viewId).toBe(v.ViewId);
    expect(vid.systemName).toBe(v.SystemName);
    expect(vid.viewName).toBe(v.Name);
  });

  it('CnsViewId #ctor check undefined argument', () => {
    expect(() => new CnsViewId(undefined!)).toThrow();
    expect(() => new CnsViewId(null!)).toThrow();
  });

  it('CnsViewId #ctor check undefined system-id', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    v.SystemId = NaN;
    expect(() => new CnsViewId(v)).toThrow();
  });

  it('CnsViewId #ctor check undefined view-id', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    v.ViewId = NaN;
    expect(() => new CnsViewId(v)).toThrow();
  });

  it('CnsViewId #ctor does NOT reference ViewNode object', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    const vid1: CnsViewId = new CnsViewId(v1);
    const vid2: CnsViewId = new CnsViewId(v2);
    expect(vid1.isEqual(vid2)).toBeTrue();
    v2.SystemId = 69;
    v2.ViewId = 86;
    v2.SystemName = 'XXXZZY';
    v2.Name = 'XOXO';
    expect(vid1.isEqual(vid2)).toBeTrue();
  });

  it('CnsViewId #toString', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    v.SystemId = 8;
    v.ViewId = 12;
    v.SystemName = 'Alpha';
    v.Name = 'VName';
    const vid: CnsViewId = new CnsViewId(v);
    expect(vid.toString()).toBe('{name=Alpha.VName, sysId=8, viewId=12}');
  });

  it('CnsViewId #compare a less-that b', () => {
    const a: ViewNode = Object.assign({}, baseViewNode);
    const b: ViewNode = Object.assign({}, baseViewNode);
    a.SystemId = 5;
    a.ViewId = 10;
    b.SystemId = 5;
    b.ViewId = 12;
    expect(CnsViewId.compare(new CnsViewId(a), new CnsViewId(b))).toBeLessThan(0);
    a.SystemId = 3;
    a.ViewId = 10;
    b.SystemId = 5;
    b.ViewId = 10;
    expect(CnsViewId.compare(new CnsViewId(a), new CnsViewId(b))).toBeLessThan(0);
  });

  it('CnsViewId #compare a equal-to b', () => {
    const a: ViewNode = Object.assign({}, baseViewNode);
    const b: ViewNode = Object.assign({}, baseViewNode);
    a.SystemId = 5;
    a.ViewId = 12;
    b.SystemId = 5;
    b.ViewId = 12;
    expect(CnsViewId.compare(new CnsViewId(a), new CnsViewId(b))).toBe(0);
  });

  it('CnsViewId #compare a greater-than b', () => {
    const a: ViewNode = Object.assign({}, baseViewNode);
    const b: ViewNode = Object.assign({}, baseViewNode);
    a.SystemId = 3;
    a.ViewId = 14;
    b.SystemId = 3;
    b.ViewId = 11;
    expect(CnsViewId.compare(new CnsViewId(a), new CnsViewId(b))).toBeGreaterThan(0);
    a.SystemId = 3;
    a.ViewId = 14;
    b.SystemId = 1;
    b.ViewId = 14;
    expect(CnsViewId.compare(new CnsViewId(a), new CnsViewId(b))).toBeGreaterThan(0);
  });

  it('CnsViewId #compare with undefined values', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    expect(CnsViewId.compare(undefined!, vid)).toBeLessThan(0);
    expect(CnsViewId.compare(vid, undefined!)).toBeGreaterThan(0);
    expect(CnsViewId.compare(undefined!, undefined!)).toBe(0);
  });

  it('CnsViewId #isEqual is-equal', () => {
    const a: ViewNode = Object.assign({}, baseViewNode);
    const b: ViewNode = Object.assign({}, baseViewNode);
    a.SystemId = 5;
    a.ViewId = 12;
    a.SystemName = 'SysName';
    a.Name = 'VName';
    const avid: CnsViewId = new CnsViewId(a);
    b.SystemId = 5;
    b.ViewId = 12;
    b.SystemName = 'SysName';
    b.Name = 'VName';
    expect(avid.isEqual(new CnsViewId(b))).toBeTrue();
  });

  it('CnsViewId #isEqual is-not-equal', () => {
    const a: ViewNode = Object.assign({}, baseViewNode);
    const b: ViewNode = Object.assign({}, baseViewNode);
    a.SystemId = 5;
    a.ViewId = 12;
    a.SystemName = 'SysName';
    a.Name = 'VName';
    const avid: CnsViewId = new CnsViewId(a);
    b.SystemId = 999;
    b.ViewId = 12;
    b.SystemName = 'SysName';
    b.Name = 'VName';
    expect(avid.isEqual(new CnsViewId(b))).toBeFalse();
    b.SystemId = 5;
    b.ViewId = 999;
    expect(avid.isEqual(new CnsViewId(b))).toBeFalse();
    b.ViewId = 12;
    b.SystemName = 'XXX';
    expect(avid.isEqual(new CnsViewId(b))).toBeFalse();
    b.SystemName = 'SysName';
    b.Name = 'XXX';
    expect(avid.isEqual(new CnsViewId(b))).toBeFalse();
    b.Name = 'VName';
    expect(avid.isEqual(new CnsViewId(b))).toBeTrue();
  });

  it('CnsViewId #isEqual with undefined values', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    expect(CnsViewId.isEqual(vid, undefined!)).toBeFalse();
    expect(CnsViewId.isEqual(undefined!, vid)).toBeFalse();
    expect(CnsViewId.isEqual(undefined!, undefined!)).toBeTrue();
  });

  it('CnsViewId #isViewNodeMatch positive', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    expect(vid.isViewNodeMatch(v)).toBeTrue();
    // Only numeric id information should be used to test matching view-node!
    v.SystemName = 'XXX';
    v.Name = 'YYY';
    expect(vid.isViewNodeMatch(v)).toBeTrue();
  });

  it('CnsViewId #isViewNodeMatch negative', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    expect(vid.isViewNodeMatch(v)).toBeTrue();
    const systemIdHold: number = v.SystemId;
    v.SystemId = 69;
    expect(vid.isViewNodeMatch(v)).toBeFalse();
    v.SystemId = systemIdHold;
    v.ViewId = 86;
    expect(vid.isViewNodeMatch(v)).toBeFalse();
  });

  it('CnsViewId #isViewNodeMatch with undefined value', () => {
    const vid: CnsViewId = new CnsViewId(baseViewNode);
    expect(vid.isViewNodeMatch(undefined!)).toBeFalse();
    expect(vid.isViewNodeMatch(null!)).toBeFalse();
  });

  it('CnsViewId #containsObject positive', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    const bo: BrowserObject = Object.assign({}, baseBrowserObject);
    bo.SystemId = v.SystemId;
    bo.ViewId = v.ViewId;
    expect(vid.containsObject(bo)).toBeTrue();
  });

  it('CnsViewId #containsObject negative', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    const bo: BrowserObject = Object.assign({}, baseBrowserObject);
    bo.SystemId = v.SystemId;
    bo.ViewId = v.ViewId;
    expect(vid.containsObject(bo)).toBeTrue();
    bo.SystemId = 69;
    expect(vid.containsObject(bo)).toBeFalse();
    bo.SystemId = v.SystemId;
    bo.ViewId = 86;
    expect(vid.containsObject(bo)).toBeFalse();
  });

  it('CnsViewId #containsObject with designation-string fallback positive', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    const bo: BrowserObject = Object.assign({}, baseBrowserObject);
    bo.SystemId = undefined!;
    bo.ViewId = undefined!;
    bo.Designation = `${v.SystemName}.${v.Name}:Foo.Bar`;
    expect(vid.containsObject(bo)).toBeTrue();
  });

  it('CnsViewId #containsObject with designation-string fallback negative', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    const bo: BrowserObject = Object.assign({}, baseBrowserObject);
    bo.SystemId = undefined!;
    bo.ViewId = undefined!;
    bo.Designation = `${v.SystemName}XXX.${v.Name}:Foo.Bar`;
    expect(vid.containsObject(bo)).toBeFalse();
    bo.Designation = `${v.SystemName}.${v.Name}XXX:Foo.Bar`;
    expect(vid.containsObject(bo)).toBeFalse();
  });

  it('CnsViewId #containsObject uses designation-string fallback under correct conditions', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const vid: CnsViewId = new CnsViewId(v);
    const bo: BrowserObject = Object.assign({}, baseBrowserObject);
    // If system-id and view-id are both defined, designation should NOT be used
    bo.SystemId = v.SystemId;
    bo.ViewId = v.ViewId;
    bo.Designation = `${v.SystemName}XXX.${v.Name}:Foo.Bar`; // force name out of scope to ensure it is not used
    expect(vid.containsObject(bo)).toBeTrue();
    // If view-id is undefined, designation should be used
    bo.SystemId = v.SystemId;
    bo.ViewId = undefined!;
    bo.Designation = `${v.SystemName}XXX.${v.Name}:Foo.Bar`;
    expect(vid.containsObject(bo)).toBeFalse();
    bo.Designation = `${v.SystemName}.${v.Name}:Foo.Bar`;
    expect(vid.containsObject(bo)).toBeTrue();
    // If system-id is undefined, designation should be used
    bo.SystemId = undefined!;
    bo.ViewId = v.ViewId;
    bo.Designation = `${v.SystemName}XXX.${v.Name}:Foo.Bar`;
    expect(vid.containsObject(bo)).toBeFalse();
    bo.Designation = `${v.SystemName}.${v.Name}:Foo.Bar`;
    expect(vid.containsObject(bo)).toBeTrue();
  });

  it('CnsViewId #containsObject with undefined value', () => {
    const vid: CnsViewId = new CnsViewId(baseViewNode);
    expect(vid.containsObject(undefined!)).toBeFalse();
    expect(vid.containsObject(null!)).toBeFalse();
  });

  it('CnsViewId #containsDesignation with undefined value', () => {
    const vid: CnsViewId = new CnsViewId(baseViewNode);
    expect(vid.containsDesignation(undefined!)).toBeFalse();
    expect(vid.containsDesignation(null!)).toBeFalse();
  });

  it('CnsViewId #containsDesignationString with undefined value', () => {
    const vid: CnsViewId = new CnsViewId(baseViewNode);
    expect(vid.containsDesignationString(undefined!)).toBeFalse();
    expect(vid.containsDesignationString(null!)).toBeFalse();
    expect(vid.containsDesignationString('')).toBeFalse();
  });

  it('ViewInfo #ctor', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    const v3: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemId = 2;
    v2.ViewId = 11;
    v3.SystemId = 4;
    v3.ViewId = 10;
    v3.Descriptor = v2.Descriptor = v1.Descriptor;
    v3.ViewType = v2.ViewType = v1.ViewType = 2;
    const vinfo: ViewInfo = new ViewInfo([v1, v2, v3]);
    expect(vinfo.description).toBe(v1.Descriptor);
    expect(vinfo.viewType).toBe(ViewTypeConverter.toViewType(v1.ViewType));
    expect(vinfo.cnsViews).toBeDefined();
    expect(vinfo.cnsViews.length).toBe(3);
    expect(vinfo.cnsViews.some(v => v.isViewNodeMatch(v1))).toBeTrue();
    expect(vinfo.cnsViews.some(v => v.isViewNodeMatch(v2))).toBeTrue();
    expect(vinfo.cnsViews.some(v => v.isViewNodeMatch(v3))).toBeTrue();
  });

  it('ViewInfo #ctor check undefined argument', () => {
    expect(() => new ViewInfo(undefined!)).toThrow();
    expect(() => new ViewInfo(null!)).toThrow();
  });

  it('ViewInfo #ctor check empty array argument', () => {
    expect(() => new ViewInfo([])).toThrow();
  });

  it('ViewInfo #ctor check incompatible views by description', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    const v3: ViewNode = Object.assign({}, baseViewNode);
    v3.Descriptor = v2.Descriptor = v1.Descriptor;
    v3.ViewType = v2.ViewType = v1.ViewType = 2;
    v3.Descriptor += 'XXX';
    expect(() => new ViewInfo([v1, v2, v3])).toThrow();
  });

  it('ViewInfo #ctor check incompatible views by type`', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    const v3: ViewNode = Object.assign({}, baseViewNode);
    v3.Descriptor = v2.Descriptor = v1.Descriptor;
    v2.ViewType = v1.ViewType = 2;
    v3.ViewType = 1;
    expect(() => new ViewInfo([v1, v2, v3])).toThrow();
  });

  it('ViewInfo #toString', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemId = 2;
    v1.ViewId = 12;
    v1.SystemName = 'Alpha';
    v1.Name = 'V1';
    v2.SystemId = 3;
    v2.ViewId = 13;
    v2.SystemName = 'Beta';
    v2.Name = 'V2';
    v1.Descriptor = v2.Descriptor = 'Foo';
    v1.ViewType = v2.ViewType = 2;
    const vinfo: ViewInfo = new ViewInfo([v1, v2]);
    expect(vinfo.toString()).toBe('{description=Foo, type=2, cnsViews=[{name=Alpha.V1, sysId=2, viewId=12},{name=Beta.V2, sysId=3, viewId=13}]}');
  });

  it('ViewInfo #isEqual is-equal', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    const v3: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemId = 2;
    v2.ViewId = 11;
    v3.SystemId = 4;
    v3.ViewId = 10;
    v3.Descriptor = v2.Descriptor = v1.Descriptor;
    v3.ViewType = v2.ViewType = v1.ViewType;
    // NOTE: test that order that cns-views are provided in c'tor does not affect equality!
    const a: ViewInfo = new ViewInfo([v1, v2, v3]);
    const b: ViewInfo = new ViewInfo([v3, v1, v2]); // vary view order
    expect(a.isEqual(b)).toBeTrue();
    expect(b.isEqual(a)).toBeTrue();
  });

  it('ViewInfo #isEqual is-not-equal by description', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const a: ViewInfo = new ViewInfo([v]);
    v.Descriptor += 'XXX';
    const b: ViewInfo = new ViewInfo([v]);
    expect(a.isEqual(b)).toBeFalse();
    expect(b.isEqual(a)).toBeFalse();
  });

  it('ViewInfo #isEqual is-not-equal by view-type', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const a: ViewInfo = new ViewInfo([v]);
    v.ViewType += 1;
    const b: ViewInfo = new ViewInfo([v]);
    expect(a.isEqual(b)).toBeFalse();
    expect(b.isEqual(a)).toBeFalse();
  });

  it('ViewInfo #isEqual is-not-equal by number of views', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    const a: ViewInfo = new ViewInfo([v1, v2]);
    const b: ViewInfo = new ViewInfo([v1]);
    expect(a.isEqual(b)).toBeFalse();
    expect(b.isEqual(a)).toBeFalse();
  });

  it('ViewInfo #isEqual is-not-equal by cns-view system-id', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const a: ViewInfo = new ViewInfo([v]);
    v.SystemId += 1;
    const b: ViewInfo = new ViewInfo([v]);
    expect(a.isEqual(b)).toBeFalse();
    expect(b.isEqual(a)).toBeFalse();
  });

  it('ViewInfo #isEqual is-not-equal by cns-view system-name', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const a: ViewInfo = new ViewInfo([v]);
    v.SystemName += 'XXX';
    const b: ViewInfo = new ViewInfo([v]);
    expect(a.isEqual(b)).toBeFalse();
    expect(b.isEqual(a)).toBeFalse();
  });

  it('ViewInfo #isEqual is-not-equal by cns-view view-id', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const a: ViewInfo = new ViewInfo([v]);
    v.ViewId += 1;
    const b: ViewInfo = new ViewInfo([v]);
    expect(a.isEqual(b)).toBeFalse();
    expect(b.isEqual(a)).toBeFalse();
  });

  it('ViewInfo #isEqual is-not-equal by cns-view view-name', () => {
    const v: ViewNode = Object.assign({}, baseViewNode);
    const a: ViewInfo = new ViewInfo([v]);
    v.Name += 'XXX';
    const b: ViewInfo = new ViewInfo([v]);
    expect(a.isEqual(b)).toBeFalse();
    expect(b.isEqual(a)).toBeFalse();
  });

  it('ViewInfo #isEqual with undefined values', () => {
    const vinfo: ViewInfo = new ViewInfo([baseViewNode]);
    expect(ViewInfo.isEqual(vinfo, undefined!)).toBeFalse();
    expect(ViewInfo.isEqual(undefined!, vinfo)).toBeFalse();
    expect(ViewInfo.isEqual(undefined!, undefined!)).toBeTrue();
  });

  it('ViewInfo #containsViewNode positive', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemId = 2;
    v2.ViewId = 11;
    v2.Descriptor = v1.Descriptor;
    v2.ViewType = v1.ViewType;
    const vinfo: ViewInfo = new ViewInfo([v1, v2]);
    expect(vinfo.containsViewNode(v1)).toBeTrue();
    expect(vinfo.containsViewNode(v2)).toBeTrue();
  });

  it('ViewInfo #containsViewNode negative', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    const v3: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemId = 2;
    v2.ViewId = 11;
    v3.SystemId = 4;
    v3.ViewId = 10;
    v3.Descriptor = v2.Descriptor = v1.Descriptor;
    v3.ViewType = v2.ViewType = v1.ViewType;
    const vinfo: ViewInfo = new ViewInfo([v1, v3]);
    expect(vinfo.containsViewNode(v2)).toBeFalse();
  });

  it('ViewInfo #containsObject positive', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemId = 3;
    v2.ViewId = 11;
    const vinfo: ViewInfo = new ViewInfo([v1, v2]);
    const bo: BrowserObject = Object.assign({}, baseBrowserObject);
    bo.SystemId = v1.SystemId;
    bo.ViewId = v1.ViewId;
    expect(vinfo.containsObject(bo)).toBeTrue();
    bo.SystemId = v2.SystemId;
    bo.ViewId = v2.ViewId;
    expect(vinfo.containsObject(bo)).toBeTrue();
  });

  it('ViewInfo #containsObject negative', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemId = 3;
    v2.ViewId = 11;
    const vinfo: ViewInfo = new ViewInfo([v1, v2]);
    const bo: BrowserObject = Object.assign({}, baseBrowserObject);
    bo.SystemId = 69;
    bo.ViewId = v1.ViewId;
    expect(vinfo.containsObject(bo)).toBeFalse();
    bo.SystemId = v2.SystemId;
    bo.ViewId = 86;
    expect(vinfo.containsObject(bo)).toBeFalse();
  });

  it('ViewInfo #containsDesignationString positive', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemName = 'Sys1';
    v1.Name = 'VName1';
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemName = 'Sys2';
    v2.Name = 'VName2';
    v2.SystemId = 3;
    v2.ViewId = 11;
    const vinfo: ViewInfo = new ViewInfo([v1, v2]);
    expect(vinfo.containsDesignationString(`${v1.SystemName}.${v1.Name}`)).toBeTrue();
    expect(vinfo.containsDesignationString(`${v1.SystemName}.${v1.Name}:Foo.Bar`)).toBeTrue();
    expect(vinfo.containsDesignationString(`${v2.SystemName}.${v2.Name}:Foo.Bar`)).toBeTrue();
  });

  it('ViewInfo #containsDesignationString negative', () => {
    const v1: ViewNode = Object.assign({}, baseViewNode);
    const v2: ViewNode = Object.assign({}, baseViewNode);
    v1.SystemName = 'Sys1';
    v1.Name = 'VName1';
    v1.SystemId = 2;
    v1.ViewId = 10;
    v2.SystemName = 'Sys2';
    v2.Name = 'VName2';
    v2.SystemId = 3;
    v2.ViewId = 11;
    const vinfo: ViewInfo = new ViewInfo([v1, v2]);
    expect(vinfo.containsDesignationString(`${v1.SystemName}XXX.${v1.Name}:Foo.Bar`)).toBeFalse();
    expect(vinfo.containsDesignationString(`${v2.SystemName}.${v2.Name}XXX:Foo.Bar`)).toBeFalse();
  });

  it('CnsViewId #containsDesignationString with undefined value', () => {
    const vinfo: ViewInfo = new ViewInfo([baseViewNode]);
    expect(vinfo.containsDesignationString(undefined!)).toBeFalse();
    expect(vinfo.containsDesignationString(null!)).toBeFalse();
    expect(vinfo.containsDesignationString('')).toBeFalse();
  });

});
