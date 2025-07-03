import { ViewNode } from './data.model';
import { Designation, designationSeparator, designationViewSeparator } from './designation.model';

/**
 * Location class. Parses CNS locations and allows to read the parts of it.
 * Valid locations are:
 * System1.View 1:Root Node.Node 1.Node 2
 * View 1:Root Node.Node 1.Node 2
 * System1.View 1:RootNode
 * System1.View 1
 * View 1
 *
 * Remark:
 * A designation is specifed as: (Full) assembled system browser node names; e.g. System1.View1:RootNode.Node1.Node2
 * A CNS location is specifed as: (Full) assembled system browser node display names (aka descriptions); e.g. System1.View 1:Root Node.Node 1.Node 2
 *
 * @export
 * @class CnsLocation
 */
export class CnsLocation {

  private readonly designation: Designation | undefined;

  /**
   * The separator for the node parts.
   * As Desigo CC does not support configuring this separator, FlexClient can savely hard-code it: '.'
   * Note: The separator is equal to the designationSeparator
   *
   * @static
   * @returns {string}
   * @memberof CnsLocation
   */
  public static locationSeparator(): string {
    return designationSeparator;
  }

  /**
   * The separator for the view.
   * As Desigo CC does not support configuring this separator, FlexClient can savely hard-code it: ':'
   * Note: The separator is equal to the designationViewSeparator
   *
   * @static
   * @returns {string}
   * @memberof CnsLocation
   */
  public static locationViewSeparator(): string {
    return designationViewSeparator;
  }

  /**
   * Creates the location from the parameters.
   * The parameters are not checked for validity!
   *
   * @static
   * @param {string} systemName
   * @param {string} viewDescription
   * @returns {string} concatenated parameters as follows: 'systemName.viewDescription'
   * @memberof CnsLocation
   */
  public static createLocation(systemName: string, viewDescription: string): string {
    return Designation.createDesignation(systemName, viewDescription);
  }

  /**
   * Creates a cns node location from the parameters.
   * The parameters are not checked for validity!
   *
   * @static
   * @param {string} systemName
   * @param {string} viewDescription
   * @param {string} nodeDescription
   * @returns {string} concatenated parameters as follows: 'systemName.viewDescription:nodeDescription'
   * @memberof CnsLocation
   */
  public static createNodeLocation(systemName: string, viewDescription: string, nodeDescription: string): string {
    return Designation.createNodeDesignation(systemName, viewDescription, nodeDescription);
  }

  /**
   * Appends a cns node to the location.
   * The parameters are not checked for validity!
   *
   * @static
   * @param {string } location
   * @param {string } nodeDescription
   * @returns {string } concatenated parameters as follows: 'location.nodeDescription'
   * @memberof CnsLocation
   */
  public static appendNodeName(location: string, nodeDescription: string): string {
    return Designation.appendNodeName(location, nodeDescription);
  }

  /**
   * Validate the provided string for correctness as a CNS node description (a.k.a., descriptor, display-name).
   *
   * @static
   * @param nodeDescription string to validate as a CNS description.
   * @returns { boolean }
   * @memberof Designation
   */
  public static checkNodeDescription(nodeDescription: string): boolean {
    let valid = true;

    // check for an empty string or for illegal characters
    if ((!nodeDescription) || (RegExp('[.:?*]').test(nodeDescription))) {
      valid = false;
    }
    // check for leading or trailing whitespace not needed -> turns out that the object configurator allows leading/trailing spaces in the WPF client

    return valid;
  }

  /**
   * Generate a CNS node description from a provided CNS node name.
   *
   * @static
   * @param nodeName CNS name from which to construct a CNS display name.
   * @returns { string }
   * @memberof Designation
   */
  public static createNodeDescription(nodeName: string): string | undefined {
    let newCnsDescription: string | undefined;

    // verify valid CNS Name name provided
    if (Designation.checkNodeName(nodeName)) {
      let description: string = nodeName;

      // replace underscore with space
      description = description.replace(/_/g, ' ');

      // split the name based on capital letters
      description = description.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

      // verify constructed a valid CNS name
      if (CnsLocation.checkNodeDescription(description)) {
        newCnsDescription = description;
      }
    }

    return newCnsDescription;
  }

  /**
   *Creates an instance of CnsLocation.
   * @param {string} location
   * @memberof CnsLocation
   */
  public constructor(public location: string) {
    this.designation = new Designation(location);
  }

  /**
   * Returns the location parts (display names / descriptions): [systemname, viewname, rootnode, node1, node2, ...]
   *
   * @readonly
   * @type {string[]}
   * @memberof CnsLocation
   */
  public get locationParts(): string[] | undefined {
    return this.designation?.designationParts;
  }

  /**
   * Returns true if the location is valid, otherwise false.
   * Does check if the location is formatted properly.
   * Does not check for valid description characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof CnsLocation
   */
  public get isValid(): boolean | undefined {
    return this.designation?.isValid;
  }

  /**
   * Returns true of the systemname is valid/defined.
   * Returns false if not defined.
   * Does not check for valid characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof CnsLocation
   */
  public get isSystemValid(): boolean | undefined {
    return this.designation?.isSystemValid;
  }

  /**
   * Returns the system name
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get systemName(): string | undefined {
    return this.designation?.systemName;
  }

  /**
   * Returns true if the view descriptor is valid/defined
   * Returns false if not defined.
   * Does not check for valid description characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof CnsLocation
   */
  public get isViewValid(): boolean | undefined {
    return this.designation?.isViewValid;
  }

  /**
   * Returns the view descriptor
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get viewDescription(): string | undefined {
    return this.designation?.viewName;
  }

  /**
   * Returns the view descriptor with the systemname (if existing) prepended: 'Systemname.ViewDescriptor'
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get viewDescriptionFull(): string | undefined {
    return this.designation?.viewNameFull;
  }

  /**
   * Returns true if the root node is defined.
   * Returns false if not defined.
   * Does not check for valid description characters.
   *
   * @readonly
   * @type {boolean}
   * @memberof CnsLocation
   */
  public get isRootNodeValid(): boolean | undefined {
    return this.designation?.isRootNodeValid;
  }

  /**
   * Returns the rootnode description.
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get rootNodeDescription(): string | undefined {
    return this.designation?.rootNodeName;
  }

  /**
   * Returns the full assembled location of the rootnode: 'Systemname.View Name:Root Node'
   * Returns undefined if not defined.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get rootNodeDescriptionFull(): string | undefined {
    return this.designation?.rootNodeNameFull;
  }

  /**
   * Returns the parent node location.
   * For a given location of "System1.View 1:Root Node.Node 1.Node 2" => "System1.View 1:Root Node.Node 1" is returned.
   * For a given location of "System1.View 1:Root Node" => undefined is returned.
   * For a given location of "System1.View 1" => undefined is returned.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get parentNodeLocation(): string | undefined {
    return this.designation?.parentNodeDesignation;
  }

  /**
   * Returns the location without the system and the view description
   * Returns undefined if not valid/defined.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get locationWoSystemView(): string | undefined {
    return this.designation?.designationWoSystemView;
  }

  /**
   * Returns the location without the system name
   * Returns undefined if not valid/defined.
   *
   * @readonly
   * @type {string}
   * @memberof CnsLocation
   */
  public get locationWoSystem(): string | undefined {
    return this.designation?.designationWoSystem;
  }

  /**
   * Returns the viewId which matches the view description of this location.
   * Returns undefined if the location is not valid.
   *
   * @param {ViewNode[] } views The views to search the Id in.
   * @returns {number}
   * @memberof CnsLocation
   */
  public getViewId(views: ViewNode[]): number | undefined {
    if (this.isViewValid === true) {
      const view: ViewNode | undefined = views.find((viewNode: ViewNode) => viewNode.Descriptor === this.viewDescription);
      if (view != undefined) {
        return view.ViewId;
      }
    }
    return undefined;
  }

  /**
   * Returns the systemId which matches the systemname of this location.
   * Returns undefined if the system name is not defined in this location.
   *
   * @param {ViewNode[] } views The views to search the Id in.
   * @returns {number}
   * @memberof CnsLocation
   */
  public getSystemId(views: ViewNode[]): number | undefined {
    return this.designation?.getSystemId(views);
  }
}
