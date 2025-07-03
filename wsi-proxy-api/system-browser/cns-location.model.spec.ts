import { ObjectAttributes } from '../shared/data.model';
import { CnsLocation } from './cns-location.model';
import { BrowserObject, SystemBrowserSubscription, ViewNode } from './data.model';

/* eslint-disable @typescript-eslint/naming-convention */

const viewNodes: ViewNode[] = [
  {
    Name: 'View0',
    Designation: 'System0.View0',
    Descriptor: 'View 0',
    SystemId: 0,
    SystemName: 'System0',
    ViewId: 0,
    ViewType: 0
  },
  {
    Name: 'View1',
    Designation: 'System1.View1',
    Descriptor: 'View 1',
    SystemId: 1,
    SystemName: 'System1',
    ViewId: 1,
    ViewType: 0
  }
];

/* eslint-enable @typescript-eslint/naming-convention */

// Tests  /////////////
describe('Location Data Model: ', () => {

  it('Location with system name and view description: System1.View 1', () => {
    const location: CnsLocation = new CnsLocation('System1.View 1');
    expect(location.isValid).toBe(true);
    expect(location.isSystemValid).toBe(true);
    expect(location.systemName).toBe('System1');
    expect(location.isViewValid).toBe(true);
    expect(location.viewDescription).toBe('View 1');
    expect(location.viewDescriptionFull).toBe('System1.View 1');
    expect(location.isRootNodeValid).toBe(false);
    expect(location.rootNodeDescription).toBeUndefined();
    expect(location.rootNodeDescriptionFull).toBeUndefined();
    expect(location.parentNodeLocation).toBeUndefined();
    expect(location.locationWoSystem).toBe('View 1');
    expect(location.locationWoSystemView).toBeUndefined();
    expect(location.getViewId(viewNodes)).toBe(1);
    expect(location.getSystemId(viewNodes)).toBe(1);
    expect(location.locationParts?.length).toBe(2);
    expect(location.locationParts![0]).toBe('System1');
    expect(location.locationParts![1]).toBe('View 1');
  });

  it('Location with view description only: View 1', () => {
    const location: CnsLocation = new CnsLocation('View 1');
    expect(location.isValid).toBe(true);
    expect(location.isSystemValid).toBe(false);
    expect(location.systemName).toBeUndefined();
    expect(location.isViewValid).toBe(true);
    expect(location.viewDescription).toBe('View 1');
    expect(location.viewDescriptionFull).toBe('View 1');
    expect(location.isRootNodeValid).toBe(false);
    expect(location.rootNodeDescription).toBeUndefined();
    expect(location.rootNodeDescriptionFull).toBeUndefined();
    expect(location.parentNodeLocation).toBeUndefined();
    expect(location.locationWoSystem).toBe('View 1');
    expect(location.locationWoSystemView).toBeUndefined();
    expect(location.getViewId(viewNodes)).toBe(1);
    expect(location.getSystemId(viewNodes)).toBeUndefined();
    expect(location.locationParts?.length).toBe(1);
    expect(location.locationParts![0]).toBe('View 1');
  });

  it('Full location with system name: System1.View 1:Root Node.Node 1.Node 2', () => {
    const location: CnsLocation = new CnsLocation('System1.View 1:Root Node.Node 1.Node 2');
    expect(location.isValid).toBe(true);
    expect(location.isSystemValid).toBe(true);
    expect(location.systemName).toBe('System1');
    expect(location.isViewValid).toBe(true);
    expect(location.viewDescription).toBe('View 1');
    expect(location.viewDescriptionFull).toBe('System1.View 1');
    expect(location.isRootNodeValid).toBe(true);
    expect(location.rootNodeDescription).toBe('Root Node');
    expect(location.rootNodeDescriptionFull).toBe('System1.View 1:Root Node');
    expect(location.parentNodeLocation).toBe('System1.View 1:Root Node.Node 1');
    expect(location.locationWoSystem).toBe('View 1:Root Node.Node 1.Node 2');
    expect(location.locationWoSystemView).toBe('Root Node.Node 1.Node 2');
    expect(location.getViewId(viewNodes)).toBe(1);
    expect(location.getSystemId(viewNodes)).toBe(1);
    expect(location.locationParts?.length).toBe(5);
    expect(location.locationParts![0]).toBe('System1');
    expect(location.locationParts![1]).toBe('View 1');
    expect(location.locationParts![2]).toBe('Root Node');
    expect(location.locationParts![3]).toBe('Node 1');
    expect(location.locationParts![4]).toBe('Node 2');
  });

  it('Full location without system name: View 1:Root Node.Node 1.Node 2', () => {
    const location: CnsLocation = new CnsLocation('View 1:Root Node.Node 1.Node 2');
    expect(location.isValid).toBe(true);
    expect(location.isSystemValid).toBe(false);
    expect(location.systemName).toBeUndefined();
    expect(location.isViewValid).toBe(true);
    expect(location.viewDescription).toBe('View 1');
    expect(location.viewDescriptionFull).toBe('View 1');
    expect(location.isRootNodeValid).toBe(true);
    expect(location.rootNodeDescription).toBe('Root Node');
    expect(location.rootNodeDescriptionFull).toBe('View 1:Root Node');
    expect(location.parentNodeLocation).toBe('View 1:Root Node.Node 1');
    expect(location.locationWoSystem).toBe('View 1:Root Node.Node 1.Node 2');
    expect(location.locationWoSystemView).toBe('Root Node.Node 1.Node 2');
    expect(location.getViewId(viewNodes)).toBe(1);
    expect(location.getSystemId(viewNodes)).toBeUndefined();
    expect(location.locationParts?.length).toBe(4);
    expect(location.locationParts![0]).toBe('View 1');
    expect(location.locationParts![1]).toBe('Root Node');
    expect(location.locationParts![2]).toBe('Node 1');
    expect(location.locationParts![3]).toBe('Node 2');
  });

  it('Full location with system name: System1.View 1:Root Node', () => {
    const location: CnsLocation = new CnsLocation('System1.View 1:Root Node');
    expect(location.isValid).toBe(true);
    expect(location.isSystemValid).toBe(true);
    expect(location.systemName).toBe('System1');
    expect(location.isViewValid).toBe(true);
    expect(location.viewDescription).toBe('View 1');
    expect(location.viewDescriptionFull).toBe('System1.View 1');
    expect(location.isRootNodeValid).toBe(true);
    expect(location.rootNodeDescription).toBe('Root Node');
    expect(location.rootNodeDescriptionFull).toBe('System1.View 1:Root Node');
    expect(location.parentNodeLocation).toBeUndefined();
    expect(location.locationWoSystem).toBe('View 1:Root Node');
    expect(location.locationWoSystemView).toBe('Root Node');
    expect(location.getViewId(viewNodes)).toBe(1);
    expect(location.getSystemId(viewNodes)).toBe(1);
    expect(location.locationParts?.length).toBe(3);
    expect(location.locationParts![0]).toBe('System1');
    expect(location.locationParts![1]).toBe('View 1');
    expect(location.locationParts![2]).toBe('Root Node');
  });

  it('Full location without system name: View 1:Root Node', () => {
    const location: CnsLocation = new CnsLocation('View 1:Root Node');
    expect(location.isValid).toBe(true);
    expect(location.isSystemValid).toBe(false);
    expect(location.systemName).toBeUndefined();
    expect(location.isViewValid).toBe(true);
    expect(location.viewDescription).toBe('View 1');
    expect(location.viewDescriptionFull).toBe('View 1');
    expect(location.isRootNodeValid).toBe(true);
    expect(location.rootNodeDescription).toBe('Root Node');
    expect(location.rootNodeDescriptionFull).toBe('View 1:Root Node');
    expect(location.parentNodeLocation).toBeUndefined();
    expect(location.locationWoSystem).toBe('View 1:Root Node');
    expect(location.locationWoSystemView).toBe('Root Node');
    expect(location.getViewId(viewNodes)).toBe(1);
    expect(location.getSystemId(viewNodes)).toBeUndefined();
    expect(location.locationParts?.length).toBe(2);
    expect(location.locationParts![0]).toBe('View 1');
    expect(location.locationParts![1]).toBe('Root Node');
  });

  it('Designation with a empty system name', () => {
    const location: CnsLocation = new CnsLocation('');
    expect(location.isValid).toBe(false);
    expect(location.isSystemValid).toBe(false);
    expect(location.systemName).toBeUndefined();
    expect(location.isViewValid).toBe(false);
    expect(location.viewDescription).toBeUndefined();
    expect(location.viewDescriptionFull).toBeUndefined();
    expect(location.isRootNodeValid).toBe(false);
    expect(location.rootNodeDescription).toBeUndefined();
    expect(location.rootNodeDescriptionFull).toBeUndefined();
    expect(location.parentNodeLocation).toBeUndefined();
    expect(location.locationWoSystem).toBeUndefined();
    expect(location.locationWoSystemView).toBeUndefined();
    expect(location.getViewId(viewNodes)).toBeUndefined();
    expect(location.getSystemId(viewNodes)).toBeUndefined();
    expect(location.locationParts?.length).toBe(1);
  });

  it('checkNodeDescription with good DisplayName', () => {
    expect(CnsLocation.checkNodeDescription('Mike is Super Cool!!')).toBe(true);
  });

  it('checkNodeDescription with an empty DisplayName', () => {
    expect(CnsLocation.checkNodeDescription('')).toBe(false);
  });

  it('checkNodeDescription with bad DisplayName', () => {
    expect(CnsLocation.checkNodeDescription('.M:i?k*e')).toBe(false);
  });

  it('createNodeDescription empty', () => {
    expect(CnsLocation.createNodeDescription('')).toBeUndefined();
  });

  it('createNodeDescription with underscores', () => {
    expect(CnsLocation.createNodeDescription('Mike_is_Super_Cool')).toEqual('Mike is Super Cool');
  });

  it('createNodeDescription with capitalization', () => {
    expect(CnsLocation.createNodeDescription('MikeIsSuperCool')).toEqual('Mike Is Super Cool');
  });

  it('createNodeDescription with capitalization, underscore and number', () => {
    expect(CnsLocation.createNodeDescription('Mike_is_1SuperCoolDude')).toEqual('Mike is 1 Super Cool Dude');
  });

});
