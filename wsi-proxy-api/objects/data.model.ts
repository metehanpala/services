/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Information for the selected node which provides information regarding generic
 * deletion and a list of possible child object types
 */
export interface ObjectCreationInfo {
  Designation: string;
  Description: string;
  Name: string;
  IsGenericDeleteAllowed: boolean;
  ChildObjects: ChildObjectTypeAttributes [];
}

/**
 * Attributes used to determine which objects can be generically created/deleted
 */

export interface ChildObjectTypeAttributes {
  IsGenericCreateAllowed: boolean;
  MaxChild: number;
  ExistingChildCount: number;
  Description: string;
  Name: string;
  TypeId?: number;
  IsGenericDeleteAllowed: boolean;
}

/**
 * Object type sent for generic creation
 */
export interface NewObjectParameters {
  Designation: string;
  NameChildNode: string;
  ObjectModelName: string;
  Descriptor: DescriptorAttributes;
}

/**
 * Object descriptor for generic creation
 */
export interface DescriptorAttributes {
  CommonText?: string;
  MultiLangText?: string[];
}

/**
 * Service Text Information for the specified object
 */
export interface ServiceTextInfo {
  ObjectId: string;
  ServiceText: ServiceTextAttributes;
}

/**
 * Service Text attributes
 */

export interface ServiceTextAttributes {
  InformationText: string;
  Memo: string;
}

/**
 * Service Text parameters for updating service text
 */
export interface ServiceTextParameters {
  Memo: string;
}

/* eslint-enable @typescript-eslint/naming-convention */
