import { ObjectAttributes, SubscriptionGms } from '../shared/data.model';

/*
* Regular expression for validating and replacing invalid characters from a cns name
*/
export const CNS_NAME_REGEX = RegExp('[ \.:;,\\[\\]\*\?{}@\$]', 'g');

/*
* Regular expression for validating and replacing invalid characters from a cns description
*/
export const CNS_DESCRIPTION_REGEX = RegExp('[.:?*]', 'g');

/* eslint-disable @typescript-eslint/naming-convention */

export interface ViewNode {
  Name: string;
  Designation: string;
  Descriptor: string;
  SystemId: number;
  SystemName: string;
  ViewId: number;
  ViewType: number;
}

/**
 * CNS view type.
 */
export const enum ViewType {
  Management,
  Application,
  Logical,
  Physical,
  User
}

/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Utility class to convert a WSI view-type numeric value to/from a ViewType enum value.
 */
export abstract class ViewTypeConverter {
  public static toViewType(wsival: number): ViewType | undefined {
    let vt: ViewType | undefined;
    switch (wsival) {
      case 0:
        vt = ViewType.Management;
        break;
      case 1:
        vt = ViewType.Application;
        break;
      case 2:
        vt = ViewType.Logical;
        break;
      case 3:
        vt = ViewType.Physical;
        break;
      case 4:
        vt = ViewType.User;
        break;
      default:
        // Unknown/unsupported; leave type undefined!
        break;
    }
    return vt;
  }
  public static toNumber(vt: ViewType): number | undefined {
    let wsival: number | undefined;
    switch (vt) {
      case ViewType.Management:
        wsival = 0;
        break;
      case ViewType.Application:
        wsival = 1;
        break;
      case ViewType.Logical:
        wsival = 2;
        break;
      case ViewType.Physical:
        wsival = 3;
        break;
      case ViewType.User:
        wsival = 4;
        break;
      default:
        // Unknown/unsupported; leave numeric value undefined!
        break;
    }
    return wsival;
  }
}

/* eslint-disable @typescript-eslint/naming-convention */

export interface BrowserObject {
  Attributes: ObjectAttributes;
  Descriptor: string;
  Designation: string;
  HasChild: boolean;
  Name: string;
  Location: string;
  ObjectId: string;
  SystemId: number;
  ViewId: number;
  ViewType: number;
  AdditionalInfo?: any;
}

export interface Page {
  Nodes: BrowserObject[];
  Page: number;
  Size: number;
  Total: number;
}

export interface ObjectNode {
  ObjectId: string;
  ErrorCode: number;
  Nodes: BrowserObject[];
}

export const enum SearchOption {
  designation = 0,
  description = 1,
  objectId = 2,
  alias = 3
}

export class SystemBrowserSubscription {

  public static isNodeAdded(action: number, change: number): boolean {
    return (action === 10) && (change === 5) ? true : false;
  }

  public static isNodeDeleted(action: number, change: number): boolean {
    return (action === 8) && (change === 5) ? true : false;
  }

  public constructor(
    public Action: number,
    public Change: number,
    public Node: BrowserObject,
    public View: ViewNode,
    public SubscriptionKey: number) {
  }
}

export interface SystemBrowserSubscriptionKey {
  Key: number;
  Designations: string[];
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

/* eslint-enable @typescript-eslint/naming-convention */

export class SystemBrowserSubscriptionKeyImpl implements SubscriptionGms {
  constructor(private readonly subWsi: SystemBrowserSubscriptionKey) {
  }
  public get key(): number {
    return this.subWsi.Key;
  }
  public get errorCode(): number {
    return this.subWsi.ErrorCode;
  }
  public get designations(): string[] {
    return this.subWsi.Designations;
  }
  /**
   * Describes the the effective addressed propertyId
   *
   * @readonly
   * @type {string}
   * @memberof SubscriptionGmsCmd
   */
  public get propertyId(): string {
    return this.originalId;
  }
  /**
   * Describes/contains the original requested string (Id)
   * (use designation as a substitute)
   *
   * @readonly
   * @type {string}
   * @memberof SubscriptionGmsCmd
   */
  public get originalId(): string | any {
    return this.designations && this.designations.length > 0 ? this.designations[0] : undefined;
  }
}
