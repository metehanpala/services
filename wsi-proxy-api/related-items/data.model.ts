import { BrowserObject } from '../system-browser/data.model';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * RelatedItemsRepresentation:
 *
 * groupDescriptor - if non-blank, will be used to group items and as the group display name
 * itemDescriptor - if non-blank, will be used for the item's display name
 * parameter - an optional parameter for the item
 * reference - if the link is external, the string contains a reference uin the form "{keyword}{reference}". The list of keywords is:
 *    Keyword   Description
 *    file://		A URL for a file. This can refer to a local or remote file.   Example - file://c:\Documents\Reference.pdf
 *    file:///	An alternate form of a URL for a file. This can refer to a local or remote file.    Example - file:///\\ServerName\Filename.doc
 *    http://		HTTP location.    Example - http://www.google.com
 *    https://	Secured HTTP location.    Example - https://intranet.industry.usa.siemens.com/sector/home/Pages/Default.aspx
 *    ftp://		File transfer location.		Example - ftp://<insert ftp site here>
 *    dpid://		Internally supported but not currently used: represents a DPID.   xample - dpid://System1:AnalogInput01
 *
 * groupOrder - if defined, used to sort the items within the group
 * mode - mode in which the item should be visible (operation | engineering)
 * sourceType - source of the link (system | user | dynamic)
 * nodes - array of browser objects, one for each (unique) occurence of the related object in a view
 */

export interface RelatedItemsRepresentation {
  GroupDescriptor?: string;
  ItemDescriptor?: string;
  Parameter?: string;
  Reference: string;
  GroupOrder?: number;
  Mode: number;
  SourceType: number;
  Nodes: BrowserObject[];
}

/**
 * ObjectRelatedItems:
 *
 * errorCode - error code specific to the requested object
 * objectId - object ID of the requested object
 * relatedItems - array of objects related to the requested object
 */

export interface ObjectRelatedItems {
  ErrorCode: number;
  ObjectId: string;
  RelatedItems: RelatedItemsRepresentation[];
}

/**
 * RelatedObjects:
 *
 * relatedObjects - one entry per requested object
 */

export interface RelatedObjects {
  RelatedResults: ObjectRelatedItems[];
}

/* eslint-enable @typescript-eslint/naming-convention */
