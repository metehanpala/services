import { CnsLocation } from './cns-location.model';
import { ViewNode } from './data.model';

/**
 * The separator for the node parts.
 * As Desigo CC does not support configuring this separator, FlexClient can savely hard-code it: '.'
 */
export const designationSeparator = '.';
/**
 * The separator for the view.
 * As Desigo CC does not support configuring this separator, FlexClient can savely hard-code it: ':'
 */
export const designationViewSeparator = ':';
export const allDesignationSeparatorRegEx = new RegExp(/\.|:/g);

/**
 * Designation class. Parses CNS designations and allows to read the parts of it.
 * Valid designation are:
 * System1.View1:RootNode.Node1.Node2
 * View1:RootNode.Node1.Node2
 * System1.View1:RootNode
 * System1.View1
 * View1
 *
 * Remark:
 * A designation is specifed as: (Full) assembled system browser node names; e.g. System1.View1:RootNode.Node1.Node2
 * A CNS location is specifed as: (Full) assembled system browser node display names (aka descriptions); e.g. System1.View 1:Root Node.Node 1.Node 2
 *
 * @export
 * @class Designation
 */
export class Designation {

  private systemSeparatorPos = -1;
  private viewSeparatorPos = -1;
  private lastNodeSeparatorPos = -1;
  private rootNodeSeparatorPos = -1;
  private _designationParts: string[] | undefined;

  /**
   * Creates the designation from the parameters.
   * The parameters are not checked for validity!
   *
   * @static
   * @param {string } systemName
   * @param {string } viewName
   * @returns {string } concatenated parameters as follows: 'systemName.viewName'
   * @memberof Designation
   */
  public static createDesignation(systemName: string, viewName: string): string {
    return systemName + designationSeparator + viewName;
  }

  /**
   * Creates a cns node designation from the parameters.
   * The parameters are not checked for validity!
   *
   * @static
   * @param {string } systemName
   * @param {string } viewName
   * @param {string } nodeName
   * @returns {string } concatenated parameters as follows: 'systemName.viewName:nodeName'
   * @memberof Designation
   */
  public static createNodeDesignation(systemName: string, viewName: string, nodeName: string): string {
    return Designation.createDesignation(systemName, viewName) + designationViewSeparator + nodeName;
  }

  /**
   * Appends a cns node to the designation.
   * The parameters are not checked for validity!
   *
   * @static
   * @param {string } designation
   * @param {string } nodeName
   * @returns {string } concatenated parameters as follows: 'designation.nodeName'
   * @memberof Designation
   */
  public static appendNodeName(designation: string, nodeName: string): string {
    return designation + designationSeparator + nodeName;
  }

  /**
   * Validate the provided string for correctness as a CNS name.
   *
   * @static
   * @param nodeName string to validate as a CNS name.
   * @returns { boolean }
   * @memberof Designation
   */
  public static checkNodeName(nodeName: string): boolean {
    let valid = true;

    // check for an empty string or for reserve characters: ' ', '.', ':', ';', ',', '[', ']', '*', '?', '{', '}','@', '$'
    if ((!nodeName) || (RegExp('[ \.:;,\\[\\]\*\?{}@\$]').test(nodeName))) {
      valid = false;
    }

    return valid;
  }

  /**
   * Generate a CNS name from the provided CNS description (a.k.a., descriptor, display-name).
   *
   * @static
   * @param nodeDescription CNS description from which to construct a CNS name.
   * @returns { string }
   * @memberof Designation
   */
  public static createNodeName(nodeDescription: string): string | undefined {
    let newNodeName: string | undefined;

    // verify valid CNS description provided
    if (CnsLocation.checkNodeDescription(nodeDescription)) {
      let name: string = nodeDescription;

      // remove reserved characters (except spaces which will be replaced below)
      name = name.replace(/[\.:;,\[\]\*\?{}@\$]/g, '');

      // remove spaces which are ahead of capital letters
      name = name.replace(/([ ])([A-Z])/g, '$2');

      // replace remaining spaces with underscores
      name = name.replace(/[ ]/g, '_');

      // verify constructed a valid CNS name
      if (Designation.checkNodeName(name)) {
        newNodeName = name;
      }
    }

    return newNodeName;
  }

  /**
   * Creates an instance of Designation.
   * @param {string } designation
   * @memberof Designation
   */
  public constructor(public designation: string) {
    this.init();
  }

  /**
   * Returns the designation parts: [systemname, viewname, rootnode, node1, node2, ...]
   *
   * @readonly
   * @type {string[]}
   * @memberof Designation
   */
  public get designationParts(): string[] | undefined {
    return this._designationParts;
  }

  /**
   * Returns true if the designation is valid, otherwise false.
   * Does check if the designation is formatted properly.
   * Does not check for valid name characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof Designation
   */
  public get isValid(): boolean {
    return (this.isViewValid === true) ? true : false;
  }

  /**
   * Returns true if the systemname is valid/defined.
   * Returns false if not defined.
   * Does not check for valid characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof Designation
   */
  public get isSystemValid(): boolean {
    return ((this.systemSeparatorPos > 0) && this.designationParts && (this.designationParts[0].length > 0)) ? true : false;
  }

  /**
   * Returns the system name
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get systemName(): string | undefined {
    if (this.isSystemValid === true && this._designationParts) {
      return this._designationParts[0];
    }
    return undefined;
  }

  /**
   * Returns true if the viewname is valid/defined
   * Returns false if not defined.
   * Does not check for valid name characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof Designation
   */
  public get isViewValid(): boolean {
    if (this.isSystemValid && this.designationParts) {
      return ((this.designationParts.length > 1) && (this.designationParts[1].length > 0)) ? true : false;
    } else {
      return ((this.designationParts!.length > 0) && (this.designationParts![0].length > 0)) ? true : false;
    }
  }

  /**
   * Returns the viewname
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get viewName(): string | undefined {
    if (this.isViewValid && this._designationParts) {
      if (this.isSystemValid) {
        return this._designationParts[1];
      } else {
        return this._designationParts[0];
      }
    }
    return undefined;
  }

  /**
   * Returns the view name with the systemname (if existing) prepended: 'SystemName.ViewName'
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get viewNameFull(): string | undefined {
    if (this.isViewValid && this._designationParts) {
      if (this.isSystemValid) {
        return this._designationParts[0] + designationSeparator + this._designationParts[1];
      } else {
        return this._designationParts[0];
      }
    }
    return undefined;
  }

  /**
   * Returns true if the root node is defined.
   * Returns false if not defined.
   * Does not check for valid name characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof Designation
   */
  public get isRootNodeValid(): boolean {
    if (this.isViewValid && this.designationParts) {
      if (this.isSystemValid) {
        return ((this.designationParts.length > 2) && (this.designationParts[2].length > 0)) ? true : false;
      } else {
        return ((this.designationParts.length > 1) && (this.designationParts[1].length > 0)) ? true : false;
      }
    }
    return false;
  }

  /**
   * Returns the rootnodename.
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get rootNodeName(): string | undefined {
    if (this.isRootNodeValid && this._designationParts) {
      if (this.isSystemValid) {
        return this._designationParts[2];
      } else {
        return this._designationParts[1];
      }
    }
    return undefined;
  }

  /**
   * Returns the full assembled designation of the rootnode: 'Systemname.Viewname:Rootnode'
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get rootNodeNameFull(): string | undefined {
    if (this.isRootNodeValid && this._designationParts) {
      if (this.isSystemValid) {
        return this._designationParts[0] + designationSeparator + this._designationParts[1] + designationViewSeparator + this._designationParts[2];
      } else {
        return this._designationParts[0] + designationViewSeparator + this._designationParts[1];
      }
    }
    return undefined;
  }

  /**
   * Returns the parent node designation.
   * For a given designation of "System1.View1:RootNode.Node1.Node2" => "System1.View1:RootNode.Node1" is returned.
   * For a given designation of "System1.View1:RootNode" => undefined is returned.
   * For a given designation of "System1.View1" => undefined is returned.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get parentNodeDesignation(): string | undefined {
    if ((this.isRootNodeValid) && (this.lastNodeSeparatorPos !== -1)) {
      return this.designation.substr(0, this.lastNodeSeparatorPos);
    }
    return undefined;
  }

  /**
   * Returns the designation without the system and the view name
   * Returns undefined if not valid/defined.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get designationWoSystemView(): string | undefined {
    if ((this.isValid === true) && (this.isRootNodeValid)) {
      return this.designation.substr(this.viewSeparatorPos + 1);
    }
    return undefined;
  }

  /**
   * Returns the designation without the system name
   * Returns undefined if not valid/defined.
   *
   * @readonly
   * @type {string}
   * @memberof Designation
   */
  public get designationWoSystem(): string | undefined {
    if (this.isValid) {
      if (this.isSystemValid === true) {
        return this.designation.substr(this.systemSeparatorPos + 1);
      } else {
        return this.designation;
      }
    }
    return undefined;
  }

  /**
   * Returns the viewId which matches the viewname of this designation.
   * Returns undefined if the designation is not valid.
   *
   * @param {ViewNode[] } views The views to search the Id in.
   * @returns {number}
   * @memberof Designation
   */
  public getViewId(views: ViewNode[]): number | undefined {
    if (this.isViewValid === true) {
      const view: ViewNode | undefined = views.find((viewNode: ViewNode) => viewNode.Name === this.viewName);
      if (view != undefined) {
        return view.ViewId;
      }
    }
    return undefined;
  }

  /**
   * Returns the systemId which matches the systemname of this designation.
   * Returns undefined if the system name is not defined in this designation.
   *
   * @param {ViewNode[] } views The views to search the Id in.
   * @returns {number}
   * @memberof Designation
   */
  public getSystemId(views: ViewNode[]): number | undefined {
    if ((this.isViewValid === true) && (this.isSystemValid === true)) {
      const view: ViewNode | undefined = views.find((viewNode: ViewNode) => (new Designation(viewNode.Designation)).systemName === this.systemName);
      if (view != undefined) {
        return view.SystemId;
      }
    }
    return undefined;
  }

  private init(): void {
    this.viewSeparatorPos = this.designation.indexOf(designationViewSeparator);
    this.systemSeparatorPos = this.designation.indexOf(designationSeparator);
    if (this.viewSeparatorPos !== -1) {
      if (this.viewSeparatorPos < this.systemSeparatorPos) {
        // there is no system!
        this.systemSeparatorPos = -1;
      }
      this.lastNodeSeparatorPos = this.designation.lastIndexOf(designationSeparator);
      if (this.lastNodeSeparatorPos === this.systemSeparatorPos) {
        this.lastNodeSeparatorPos = -1;
      }
      this.rootNodeSeparatorPos = this.designation.indexOf(designationSeparator, this.viewSeparatorPos + 1);
    }
    this._designationParts = this.designation.split(allDesignationSeparatorRegEx);
  }
}
