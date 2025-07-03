import { ViewNode } from './data.model';
import { Designation } from './designation.model';

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
describe('Designation Data Model: ', () => {

  it('Designation with system name and view name: System1.View1', () => {
    const designation: Designation = new Designation('System1.View1');
    expect(designation.isValid).toBe(true);
    expect(designation.isSystemValid).toBe(true);
    expect(designation.systemName).toBe('System1');
    expect(designation.isViewValid).toBe(true);
    expect(designation.viewName).toBe('View1');
    expect(designation.viewNameFull).toBe('System1.View1');
    expect(designation.isRootNodeValid).toBe(false);
    expect(designation.rootNodeName).toBeUndefined();
    expect(designation.rootNodeNameFull).toBeUndefined();
    expect(designation.parentNodeDesignation).toBeUndefined();
    expect(designation.designationWoSystem).toBe('View1');
    expect(designation.designationWoSystemView).toBeUndefined();
    expect(designation.getViewId(viewNodes)).toBe(1);
    expect(designation.getSystemId(viewNodes)).toBe(1);
    expect(designation.designationParts?.length).toBe(2);
    expect(designation.designationParts![0]).toBe('System1');
    expect(designation.designationParts![1]).toBe('View1');
  });

  it('Designation with view name only: View1', () => {
    const designation: Designation = new Designation('View1');
    expect(designation.isValid).toBe(true);
    expect(designation.isSystemValid).toBe(false);
    expect(designation.systemName).toBeUndefined();
    expect(designation.isViewValid).toBe(true);
    expect(designation.viewName).toBe('View1');
    expect(designation.viewNameFull).toBe('View1');
    expect(designation.isRootNodeValid).toBe(false);
    expect(designation.rootNodeName).toBeUndefined();
    expect(designation.rootNodeNameFull).toBeUndefined();
    expect(designation.parentNodeDesignation).toBeUndefined();
    expect(designation.designationWoSystem).toBe('View1');
    expect(designation.designationWoSystemView).toBeUndefined();
    expect(designation.getViewId(viewNodes)).toBe(1);
    expect(designation.getSystemId(viewNodes)).toBeUndefined();
    expect(designation.designationParts?.length).toBe(1);
    expect(designation.designationParts![0]).toBe('View1');
  });

  it('Full designation with system name: System1.View1:RootNode.Node1.Node2', () => {
    const designation: Designation = new Designation('System1.View1:RootNode.Node1.Node2');
    expect(designation.isValid).toBe(true);
    expect(designation.isSystemValid).toBe(true);
    expect(designation.systemName).toBe('System1');
    expect(designation.isViewValid).toBe(true);
    expect(designation.viewName).toBe('View1');
    expect(designation.viewNameFull).toBe('System1.View1');
    expect(designation.isRootNodeValid).toBe(true);
    expect(designation.rootNodeName).toBe('RootNode');
    expect(designation.rootNodeNameFull).toBe('System1.View1:RootNode');
    expect(designation.parentNodeDesignation).toBe('System1.View1:RootNode.Node1');
    expect(designation.designationWoSystem).toBe('View1:RootNode.Node1.Node2');
    expect(designation.designationWoSystemView).toBe('RootNode.Node1.Node2');
    expect(designation.getViewId(viewNodes)).toBe(1);
    expect(designation.getSystemId(viewNodes)).toBe(1);
    expect(designation.designationParts?.length).toBe(5);
    expect(designation.designationParts![0]).toBe('System1');
    expect(designation.designationParts![1]).toBe('View1');
    expect(designation.designationParts![2]).toBe('RootNode');
    expect(designation.designationParts![3]).toBe('Node1');
    expect(designation.designationParts![4]).toBe('Node2');
  });

  it('Full designation without system name: View1:RootNode.Node1.Node2', () => {
    const designation: Designation = new Designation('View1:RootNode.Node1.Node2');
    expect(designation.isValid).toBe(true);
    expect(designation.isSystemValid).toBe(false);
    expect(designation.systemName).toBeUndefined();
    expect(designation.isViewValid).toBe(true);
    expect(designation.viewName).toBe('View1');
    expect(designation.viewNameFull).toBe('View1');
    expect(designation.isRootNodeValid).toBe(true);
    expect(designation.rootNodeName).toBe('RootNode');
    expect(designation.rootNodeNameFull).toBe('View1:RootNode');
    expect(designation.parentNodeDesignation).toBe('View1:RootNode.Node1');
    expect(designation.designationWoSystem).toBe('View1:RootNode.Node1.Node2');
    expect(designation.designationWoSystemView).toBe('RootNode.Node1.Node2');
    expect(designation.getViewId(viewNodes)).toBe(1);
    expect(designation.getSystemId(viewNodes)).toBeUndefined();
    expect(designation.designationParts?.length).toBe(4);
    expect(designation.designationParts![0]).toBe('View1');
    expect(designation.designationParts![1]).toBe('RootNode');
    expect(designation.designationParts![2]).toBe('Node1');
    expect(designation.designationParts![3]).toBe('Node2');
  });

  it('Full designation with system name: System1.View1:RootNode', () => {
    const designation: Designation = new Designation('System1.View1:RootNode');
    expect(designation.isValid).toBe(true);
    expect(designation.isSystemValid).toBe(true);
    expect(designation.systemName).toBe('System1');
    expect(designation.isViewValid).toBe(true);
    expect(designation.viewName).toBe('View1');
    expect(designation.viewNameFull).toBe('System1.View1');
    expect(designation.isRootNodeValid).toBe(true);
    expect(designation.rootNodeName).toBe('RootNode');
    expect(designation.rootNodeNameFull).toBe('System1.View1:RootNode');
    expect(designation.parentNodeDesignation).toBeUndefined();
    expect(designation.designationWoSystem).toBe('View1:RootNode');
    expect(designation.designationWoSystemView).toBe('RootNode');
    expect(designation.getViewId(viewNodes)).toBe(1);
    expect(designation.getSystemId(viewNodes)).toBe(1);
    expect(designation.designationParts?.length).toBe(3);
    expect(designation.designationParts![0]).toBe('System1');
    expect(designation.designationParts![1]).toBe('View1');
    expect(designation.designationParts![2]).toBe('RootNode');
  });

  it('Full designation without system name: View1:RootNode', () => {
    const designation: Designation = new Designation('View1:RootNode');
    expect(designation.isValid).toBe(true);
    expect(designation.isSystemValid).toBe(false);
    expect(designation.systemName).toBeUndefined();
    expect(designation.isViewValid).toBe(true);
    expect(designation.viewName).toBe('View1');
    expect(designation.viewNameFull).toBe('View1');
    expect(designation.isRootNodeValid).toBe(true);
    expect(designation.rootNodeName).toBe('RootNode');
    expect(designation.rootNodeNameFull).toBe('View1:RootNode');
    expect(designation.parentNodeDesignation).toBeUndefined();
    expect(designation.designationWoSystem).toBe('View1:RootNode');
    expect(designation.designationWoSystemView).toBe('RootNode');
    expect(designation.getViewId(viewNodes)).toBe(1);
    expect(designation.getSystemId(viewNodes)).toBeUndefined();
    expect(designation.designationParts?.length).toBe(2);
    expect(designation.designationParts![0]).toBe('View1');
    expect(designation.designationParts![1]).toBe('RootNode');
  });

  it('Designation with a empty system name', () => {
    const designation: Designation = new Designation('');
    expect(designation.isValid).toBe(false);
    expect(designation.isSystemValid).toBe(false);
    expect(designation.systemName).toBeUndefined();
    expect(designation.isViewValid).toBe(false);
    expect(designation.viewName).toBeUndefined();
    expect(designation.viewNameFull).toBeUndefined();
    expect(designation.isRootNodeValid).toBe(false);
    expect(designation.rootNodeName).toBeUndefined();
    expect(designation.rootNodeNameFull).toBeUndefined();
    expect(designation.parentNodeDesignation).toBeUndefined();
    expect(designation.designationWoSystem).toBeUndefined();
    expect(designation.designationWoSystemView).toBeUndefined();
    expect(designation.getViewId(viewNodes)).toBeUndefined();
    expect(designation.getSystemId(viewNodes)).toBeUndefined();
    expect(designation.designationParts?.length).toBe(1);
  });

  it('checkNodeName with good Name', () => {
    expect(Designation.checkNodeName('Mike')).toBe(true);
  });

  it('checkNodeName with an empty Name', () => {
    expect(Designation.checkNodeName('')).toBe(false);
  });

  it('checkNodeName with a Name with leading/trailing whitespace', () => {
    expect(Designation.checkNodeName(' Mike ')).toBe(false);
  });

  it('checkNodeName with bad Name (embedded space)', () => {
    expect(Designation.checkNodeName('Mi ke')).toBe(false);
  });

  it('checkNodeName with bad Name (with reserved characters)', () => {
    expect(Designation.checkNodeName('A.:;,[]*?{}@$Z')).toBe(false);
  });

  it('createNodeName empty', () => {
    expect(Designation.createNodeName('')).toBeUndefined();
  });

  it('createNodeName all reserved charcters', () => {
    expect(Designation.createNodeName('.:;,[]*?{}@$')).toBeUndefined();
  });

  it('createNodeName upper case character with space and $ followed by upper case letter', () => {
    expect(Designation.createNodeName('A $B')).toEqual('AB');
  });

  it('createNodeName upper case character with space and $ followed by lower case letter', () => {
    expect(Designation.createNodeName('A $b')).toEqual('A_b');
  });

  it('createNodeName with capitalization, underscore, number and hyphen', () => {
    expect(Designation.createNodeName('Mike is 1 Super-Cool Dude')).toEqual('Mike_is_1Super-CoolDude');
  });

  it('createNodeName with reserved characters', () => {
    expect(Designation.createNodeName('Is [this] a {valid} node name')).toEqual('Is_this_a_valid_node_name');
  });
});
