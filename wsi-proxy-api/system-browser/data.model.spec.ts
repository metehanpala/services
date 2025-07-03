import { ObjectAttributes } from '../shared/data.model';
import { BrowserObject, SystemBrowserSubscription, ViewNode, ViewType, ViewTypeConverter } from './data.model';

/* eslint-disable @typescript-eslint/naming-convention */

const objectAttributes: ObjectAttributes[] =
[
  {
    Alias: 'alias',
    DefaultProperty: 'defaultProperty',
    DisciplineDescriptor: 'disciplineDescriptor',
    DisciplineId: 1,
    FunctionName: 'functionName',
    ManagedType: 1,
    ManagedTypeName: 'managedTypeName',
    ObjectId: 'objectId',
    SubDisciplineDescriptor: 'subDisciplineDescriptor',
    SubDisciplineId: 1,
    SubTypeDescriptor: 'subTypeDescriptor',
    SubTypeId: 1,
    TypeDescriptor: 'typeDescriptor',
    TypeId: 1,
    ObjectModelName: 'objectModelName'
  },
  {
    Alias: 'alias2',
    DefaultProperty: 'defaultProperty',
    DisciplineDescriptor: 'disciplineDescriptor',
    DisciplineId: 2,
    FunctionName: 'functionName',
    ManagedType: 1,
    ManagedTypeName: 'managedTypeName',
    ObjectId: 'objectId',
    SubDisciplineDescriptor: 'subDisciplineDescriptor',
    SubDisciplineId: 2,
    SubTypeDescriptor: 'subTypeDescriptor',
    SubTypeId: 2,
    TypeDescriptor: 'typeDescriptor',
    TypeId: 2,
    ObjectModelName: 'objectModelName'
  }
];

const browserObjects: BrowserObject[] = [
  {
    Attributes: objectAttributes[0],
    Descriptor: 'Descriptor',
    Designation: 'Designation',
    HasChild: true,
    Name: 'Name',
    Location: 'Location',
    ObjectId: 'ObjectId',
    SystemId: 1,
    ViewId: 1,
    ViewType: 0
  },
  {
    Attributes: objectAttributes[1],
    Descriptor: 'Descriptor',
    Designation: 'Designation',
    HasChild: true,
    Name: 'Name',
    Location: 'Location',
    ObjectId: 'ObjectId',
    SystemId: 2,
    ViewId: 2,
    ViewType: 0
  }
];

const viewNodes: ViewNode[] = [
  {
    Name: 'designation0',
    Designation: 'designation3.designation2:designation1.designation0',
    Descriptor: 'Descriptor',
    SystemId: 0,
    SystemName: 'SystemName0',
    ViewId: 0,
    ViewType: 0
  },
  {
    Name: 'designation1',
    Designation: 'designation0.designation1:designation2.designation3',
    Descriptor: 'Descriptor',
    SystemId: 1,
    SystemName: 'SystemName1',
    ViewId: 1,
    ViewType: 0
  }
];

/* eslint-enable @typescript-eslint/naming-convention */

// Tests  /////////////
describe('System-browser Data Model', () => {

  it('has systemBrowserSubscription', () => {
    const systemBrowserSubscription: SystemBrowserSubscription = new SystemBrowserSubscription(10, 5, browserObjects[0], viewNodes[0], 1);
    expect(SystemBrowserSubscription.isNodeAdded(systemBrowserSubscription.Action, systemBrowserSubscription.Change)).toBe(true);
    expect(SystemBrowserSubscription.isNodeDeleted(systemBrowserSubscription.Action, systemBrowserSubscription.Change)).toBe(false);
    systemBrowserSubscription.Action = 8;
    expect(SystemBrowserSubscription.isNodeDeleted(systemBrowserSubscription.Action, systemBrowserSubscription.Change)).toBe(true);
    expect(SystemBrowserSubscription.isNodeAdded(systemBrowserSubscription.Action, systemBrowserSubscription.Change)).toBe(false);
  });

  it('ViewTypeConverter with valid values', () => {
    let val: number;
    val = ViewTypeConverter.toNumber(ViewType.Application)!;
    expect(val).toBeDefined();
    expect(ViewTypeConverter.toViewType(val)).toBe(ViewType.Application);
    val = ViewTypeConverter.toNumber(ViewType.Management)!;
    expect(val).toBeDefined();
    expect(ViewTypeConverter.toViewType(val)).toBe(ViewType.Management);
    val = ViewTypeConverter.toNumber(ViewType.Physical)!;
    expect(val).toBeDefined();
    expect(ViewTypeConverter.toViewType(val)).toBe(ViewType.Physical);
    val = ViewTypeConverter.toNumber(ViewType.Logical)!;
    expect(val).toBeDefined();
    expect(ViewTypeConverter.toViewType(val)).toBe(ViewType.Logical);
    val = ViewTypeConverter.toNumber(ViewType.User)!;
    expect(val).toBeDefined();
    expect(ViewTypeConverter.toViewType(val)).toBe(ViewType.User);
  });

  it('ViewTypeConverter toViewType with invalid values', () => {
    expect(ViewTypeConverter.toViewType(undefined!)).toBeUndefined();
    expect(ViewTypeConverter.toViewType(null!)).toBeUndefined();
    expect(ViewTypeConverter.toViewType(NaN)).toBeUndefined();
    expect(ViewTypeConverter.toViewType(-4)).toBeUndefined();
  });

  it('ViewTypeConverter toNumber with invalid values', () => {
    expect(ViewTypeConverter.toNumber(undefined!)).toBeUndefined();
    expect(ViewTypeConverter.toNumber(null!)).toBeUndefined();
    expect(ViewTypeConverter.toNumber(NaN)).toBeUndefined();
  });

});
