import { fakeAsync, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { MultiMonitorServiceBase } from '../shared';
import { ObjectAttributes } from '../wsi-proxy-api/shared/data.model';
import { BrowserObject, ViewNode, ViewType } from '../wsi-proxy-api/system-browser/data.model';
import { CnsFormatOption, CnsLabel, CnsLabelEn, ViewInfo } from './cns-helper.model';
import { CnsHelperService } from './cns-helper.service';

const alias = 'alias';
const designation = 'System1.View1:RootNode.Node1.Node2';
const location = 'System1.View 1:Root Node.Node 1.Node 2';
const descriptor = 'Node 2';
const name = 'Node2';

/* eslint-disable @typescript-eslint/naming-convention */

const objectAttributes: ObjectAttributes = {
  Alias: alias,
  DefaultProperty: 'defaultProperty',
  DisciplineDescriptor: 'disciplineDescriptor',
  DisciplineId: 1,
  FunctionName: 'functionName',
  ManagedType: 1,
  ManagedTypeName: 'Graphic',
  ObjectId: 'objectId',
  SubDisciplineDescriptor: 'subDisciplineDescriptor',
  SubDisciplineId: 1,
  SubTypeDescriptor: 'subTypeDescriptor',
  SubTypeId: 1,
  TypeDescriptor: 'typeDescriptor',
  TypeId: 1,
  ObjectModelName: 'objectModelName'
};
const browserObject: BrowserObject = {
  Attributes: objectAttributes,
  Descriptor: descriptor,
  Designation: designation,
  HasChild: true,
  Name: name,
  Location: location,
  ObjectId: 'ObjectId',
  SystemId: 1,
  ViewId: 1,
  ViewType: 0
};
const baseViewNode: ViewNode = Object.freeze({
  Designation: 'SystemA.LogicalView',
  Name: 'LogicalView',
  Descriptor: 'Logical View',
  SystemName: 'SystemA',
  SystemId: 5,
  ViewId: 8,
  ViewType: 2 // WSI value for "logical" view-type
});

const browserObjectNoViewTypeA: BrowserObject = {
  Attributes: objectAttributes,
  Descriptor: 'Descriptor for browserObjectNoViewTypeA',
  Designation: 'Designation for browserObjectNoViewTypeA',
  HasChild: true,
  Name: 'browserObjectNoViewTypeA',
  Location: location,
  ObjectId: 'ObjectId',
  SystemId: 1,
  ViewId: 1,
  ViewType: undefined!
};
const browserObjectNoViewTypeB: BrowserObject = {
  Attributes: objectAttributes,
  Descriptor: 'Descriptor for browserObjectNoViewTypeB',
  Designation: 'Designation for browserObjectNoViewTypeB',
  HasChild: true,
  Name: 'browserObjectNoViewTypeB',
  Location: location,
  ObjectId: 'ObjectId',
  SystemId: 1,
  ViewId: 1,
  ViewType: undefined!
};

const browserObjectUserViewA: BrowserObject = {
  Attributes: objectAttributes,
  Descriptor: 'Descriptor for browserObjectUserViewA',
  Designation: 'Designation for browserObjectUserViewA',
  HasChild: true,
  Name: 'browserObjectUserViewa',
  Location: location,
  ObjectId: 'ObjectId',
  SystemId: 1,
  ViewId: 1,
  ViewType: 4
};
const browserObjectUserViewB: BrowserObject = {
  Attributes: objectAttributes,
  Descriptor: 'Descriptor for browserObjectUserViewB',
  Designation: 'Designation for browserObjectUserViewB',
  HasChild: true,
  Name: 'browserObjectUserViewB',
  Location: location,
  ObjectId: 'ObjectId',
  SystemId: 1,
  ViewId: 1,
  ViewType: 4
};
const browserObjectManagementView: BrowserObject = {
  Attributes: objectAttributes,
  Descriptor: 'Descriptor for browserObjectManagementView',
  Designation: 'Designation for browserObjectManagementView',
  HasChild: true,
  Name: 'browserObjectManagementView',
  Location: location,
  ObjectId: 'ObjectId',
  SystemId: 1,
  ViewId: 1,
  ViewType: 0
};

/* eslint-enable @typescript-eslint/naming-convention */

// Tests  /////////////
describe('Cns Helper Service', () => {

  let cnsHelperService: CnsHelperService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
      })],
      providers: [
        TranslateService,
        { provide: TraceService, useClass: MockTraceService },
        MultiMonitorServiceBase,
        CnsHelperService
      ]
    })
      .compileComponents();
    cnsHelperService = TestBed.inject(CnsHelperService);
  }));

  it('Create Cns Helper Service',
    inject([TranslateService, TraceService], (translateService: TranslateService, trace: TraceService) => {
      const cnsHelper: CnsHelperService = new CnsHelperService(translateService, trace, null!, null!);
      expect(cnsHelper instanceof CnsHelperService).toBe(true);
    }));

  it('Check formatting objects for Cns Setting \'Description\'',
    inject([TranslateService, TraceService], (translateService: TranslateService, trace: TraceService) => {
      const cnsHelper: CnsHelperService = new CnsHelperService(translateService, trace, null!, null!);
      cnsHelper.setActiveCnsLabel(new CnsLabel(CnsLabelEn.Description, of(''), of('')));
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Long)).toBe('System1.View 1:Root Node.Node 1.Node 2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Short)).toBe('Node 2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeSystemName)).toBe('View 1:Root Node.Node 1.Node 2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeViewName)).toBe('Root Node.Node 1.Node 2');

      expect(cnsHelper.formatCnsLabel(browserObject)).toBe('Node 2');
      expect(cnsHelper.getCnsLabelsOrdered(browserObject)).toEqual(['Node 2']);
    }
    ));

  it('Check formatting objects for Cns Setting \'Description [Alias]\'',
    inject([TranslateService, TraceService], (translateService: TranslateService, trace: TraceService) => {
      const cnsHelper: CnsHelperService = new CnsHelperService(translateService, trace, null!, null!);
      cnsHelper.setActiveCnsLabel(new CnsLabel(CnsLabelEn.DescriptionAndAlias, of(''), of('')));
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Long)).toBe('System1.View 1:Root Node.Node 1.Node 2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Short)).toBe('Node 2 [alias]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeSystemName)).toBe('View 1:Root Node.Node 1.Node 2 [alias]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeViewName)).toBe('Root Node.Node 1.Node 2 [alias]');

      expect(cnsHelper.formatCnsLabel(browserObject)).toBe('Node 2 [alias]');
      expect(cnsHelper.getCnsLabelsOrdered(browserObject)).toEqual(['Node 2', 'alias']);
    }
    ));

  it('Check formatting objects for Cns Setting \'Description [Name]\'',
    inject([TranslateService, TraceService], (translateService: TranslateService, trace: TraceService) => {
      const cnsHelper: CnsHelperService = new CnsHelperService(translateService, trace, null!, null!);
      cnsHelper.setActiveCnsLabel(new CnsLabel(CnsLabelEn.DescriptionAndName, of(''), of('')));
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Long)).toBe('System1.View 1:Root Node.Node 1.Node 2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Short)).toBe('Node 2 [Node2]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeSystemName)).toBe('View 1:Root Node.Node 1.Node 2 [Node2]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeViewName)).toBe('Root Node.Node 1.Node 2 [Node2]');

      expect(cnsHelper.formatCnsLabel(browserObject)).toBe('Node 2 [Node2]');
      expect(cnsHelper.getCnsLabelsOrdered(browserObject)).toEqual(['Node 2', 'Node2']);
    }
    ));

  it('Check formatting objects for Cns Setting \'Name\'',
    inject([TranslateService, TraceService], (translateService: TranslateService, trace: TraceService) => {
      const cnsHelper: CnsHelperService = new CnsHelperService(translateService, trace, null!, null!);
      cnsHelper.setActiveCnsLabel(new CnsLabel(CnsLabelEn.Name, of(''), of('')));
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Long)).toBe('System1.View1:RootNode.Node1.Node2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Short)).toBe('Node2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeSystemName)).toBe('View1:RootNode.Node1.Node2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeViewName)).toBe('RootNode.Node1.Node2');

      expect(cnsHelper.formatCnsLabel(browserObject)).toBe('Node2');
      expect(cnsHelper.getCnsLabelsOrdered(browserObject)).toEqual(['Node2']);
    }
    ));

  it('Check formatting objects for Cns Setting \'Name [Alias]\'',
    inject([TranslateService, TraceService], (translateService: TranslateService, trace: TraceService) => {
      const cnsHelper: CnsHelperService = new CnsHelperService(translateService, trace, null!, null!);
      cnsHelper.setActiveCnsLabel(new CnsLabel(CnsLabelEn.NameAndAlias, of(''), of('')));
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Long)).toBe('System1.View1:RootNode.Node1.Node2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Short)).toBe('Node2 [alias]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeSystemName)).toBe('View1:RootNode.Node1.Node2 [alias]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeViewName)).toBe('RootNode.Node1.Node2 [alias]');

      expect(cnsHelper.formatCnsLabel(browserObject)).toBe('Node2 [alias]');
      expect(cnsHelper.getCnsLabelsOrdered(browserObject)).toEqual(['Node2', 'alias']);
    }
    ));

  it('Check formatting objects for Cns Setting \'Name [Description]\'',
    inject([TranslateService, TraceService], (translateService: TranslateService, trace: TraceService) => {
      const cnsHelper: CnsHelperService = new CnsHelperService(translateService, trace, null!, null!);
      cnsHelper.setActiveCnsLabel(new CnsLabel(CnsLabelEn.NameAndDescription, of(''), of('')));
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Long)).toBe('System1.View1:RootNode.Node1.Node2');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.Short)).toBe('Node2 [Node 2]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeSystemName)).toBe('View1:RootNode.Node1.Node2 [Node 2]');
      expect(cnsHelper.formatBrowserObject(browserObject, CnsFormatOption.LongExcludeViewName)).toBe('RootNode.Node1.Node2 [Node 2]');

      expect(cnsHelper.formatCnsLabel(browserObject)).toBe('Node2 [Node 2]');
      expect(cnsHelper.getCnsLabelsOrdered(browserObject)).toEqual(['Node2', 'Node 2']);
    }
    ));

  it('Check #setActiveView #activeView and #activeViewValue behavior', fakeAsync(() => {
    const vA: ViewNode = Object.assign({}, baseViewNode);
    const vB: ViewNode = Object.assign({}, baseViewNode);
    vA.ViewId = 1;
    vA.ViewType = ViewType.Application;
    vA.Name = 'Application';
    vA.Descriptor = 'Application View';
    vB.ViewId = 2;
    vB.ViewType = ViewType.Management;
    vB.Name = 'Management';
    vB.Descriptor = 'Management View';
    const vinfoA: ViewInfo = new ViewInfo([vA]);
    const vinfoB: ViewInfo = new ViewInfo([vB]);

    let sub1: ViewInfo;
    cnsHelperService.activeView.subscribe(
      v => sub1 = v,
      err => fail());
    tick(1);
    expect(sub1!).toBe(null!);
    expect(cnsHelperService.activeViewValue).toBe(null!);

    cnsHelperService.setActiveView(vinfoA);
    tick(1);
    expect(sub1!.isEqual(vinfoA)).toBeTrue();
    expect(cnsHelperService.activeViewValue.isEqual(vinfoA)).toBeTrue();

    let sub2: ViewInfo;
    cnsHelperService.activeView.subscribe(
      v => sub2 = v,
      err => fail());
    tick(1);
    expect(sub1!.isEqual(vinfoA)).toBeTrue();
    expect(sub2!.isEqual(vinfoA)).toBeTrue();
    expect(cnsHelperService.activeViewValue.isEqual(vinfoA)).toBeTrue();

    cnsHelperService.setActiveView(vinfoB);
    tick(1);
    expect(sub1!.isEqual(vinfoB)).toBeTrue();
    expect(sub2!.isEqual(vinfoB)).toBeTrue();
    expect(cnsHelperService.activeViewValue.isEqual(vinfoB)).toBeTrue();
  }));

  it('Calling #setActiveView with equivalent view-info should NOT cause change notification', fakeAsync(() => {
    const vA: ViewNode = Object.assign({}, baseViewNode);
    const vB: ViewNode = Object.assign({}, baseViewNode);
    vB.SystemName += '2';
    vB.SystemId += 1;
    const vinfo1: ViewInfo = new ViewInfo([vA]);
    const vinfo2: ViewInfo = new ViewInfo([vA, vB]);
    const vinfo3: ViewInfo = new ViewInfo([vB, vA]); // equivalent vinfo2!
    const vinfo4: ViewInfo = new ViewInfo([vB]);

    let last: ViewInfo;
    let count = 0;
    cnsHelperService.activeView.subscribe(
      v => { last = v; count++; },
      err => fail());
    tick(1);
    expect(last!).toBe(null!);
    expect(count).toBe(1);

    cnsHelperService.setActiveView(vinfo1);
    tick(1);
    expect(last!).toBe(vinfo1);
    expect(count).toBe(2);

    cnsHelperService.setActiveView(vinfo2);
    tick(1);
    expect(last!).toBe(vinfo2);
    expect(count).toBe(3);

    // The following call is effectively not changing the view-info, so no indication
    // should be sent to our subscription handler
    cnsHelperService.setActiveView(vinfo3);
    tick(1);
    expect(last!).toBe(vinfo2); // no change!
    expect(count).toBe(3);

    // Also, calling with undefined view-info should be harmless
    cnsHelperService.setActiveView(undefined!);
    tick(1);
    expect(last!).toBe(vinfo2); // no change!
    expect(count).toBe(3);

    cnsHelperService.setActiveView(vinfo4);
    tick(1);
    expect(last!).toBe(vinfo4);
    expect(count).toBe(4);
  }));

  it('Checking Browser Object Sorting', fakeAsync(() => {

    expect(CnsHelperService.compareBrowserObjects(undefined!, browserObjectNoViewTypeA)).toBe(1);
    expect(CnsHelperService.compareBrowserObjects(browserObjectNoViewTypeA, undefined!)).toBe(-1);
    expect(CnsHelperService.compareBrowserObjects(browserObjectNoViewTypeB, browserObjectNoViewTypeA)).toBe(1);
    expect(CnsHelperService.compareBrowserObjects(browserObjectUserViewA, browserObjectUserViewA)).toBe(0);
    expect(CnsHelperService.compareBrowserObjects(browserObjectUserViewB, browserObjectUserViewA)).toBe(1);
    expect(CnsHelperService.compareBrowserObjects(browserObjectManagementView, browserObjectUserViewA)).toBe(1);
  }));
});
