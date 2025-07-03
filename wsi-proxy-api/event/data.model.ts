import { Link } from '../shared/data.model';

/* eslint-disable @typescript-eslint/naming-convention */

export interface EventSoundWsi {
  FileName: string;
  ResoundData: ResoundCategory[];
  Visibility: number;
  _links: Link[];
}
export interface ResoundCategory {
  Category: number;
  Timeout: number;
}
export interface EventCounter {
  CategoryId: number;
  CategoryDescriptor: string;
  TotalCount: number;
  UnprocessedCount: number;
  TotalSubsequentGrouping: number;
  UnprocessedSubsequentGrouping: number;
}

export interface EventCounterList {
  EventCategoryCounters: EventCounter[];
  TotalCounters: number;
  TotalUnprocessedCounters: number;
}

export interface SuppressedObjects {
  SuppressedCount: number;
}

export interface EventCommand {
  EventId: string;
  Id: string;
  Configuration: number;
}

export interface EventDetailsList {
  ViewId: number;
  Descriptor: string;
}

export interface AutomaticTreatmentData {
  HasFilter: boolean;
  Stations: string [];
  Timeout: number;
  Users: number [];
  CloseTreatmentWhen: string;
  OnNewEvent: string;
  OnNewHigherPrioEvent: string;
}

export interface WSIEvent {
  CategoryDescriptor:	string;
  CategoryId: number;
  Cause:	string;
  Commands: EventCommand[];
  CreationTime: string;
  Deleted:	boolean;
  DescriptionList: EventDetailsList [];
  DescriptionLocationsList: EventDetailsList[];
  DesignationList: EventDetailsList[];
  Direction: string;
  EventId: number;
  Id: string;
  InfoDescriptor: string;
  InProcessBy:	string;
  MessageText: string[];
  NextCommand: string;
  Sound: string;
  SourceDesignationList: EventDetailsList[];
  SrcDescriptor: string;
  SrcDesignation: string;
  SrcDisciplineDescriptor:	string;
  SrcDisciplineId: number;
  SrcLocation:	string;
  SrcName:	string;
  SrcObservedPropertyId:	string;
  SrcPropertyId:	string;
  SrcState: string;
  SrcSubDisciplineId: number;
  SrcSystemId:	number;
  SrcViewDescriptor:	string;
  SrcViewName:	string;
  State:	string;
  SuggestedAction: string;
  SrcSystemName: string;
  SrcAlias: string;
  OperatingProcedureId: string;
  InformationText: string;
  Timer: string;
  AutomaticTreatmentData: AutomaticTreatmentData;
}

export interface SubscriptionWsiEvent {
  ErrorCode: number;
  EventFilter: any;
  SortingOrder: any;
  RequestId: string;
  RequestFor: string;
}

export interface SubscriptionWsiEventSound {
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

export interface SubscriptionWsiEventCounters {
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

export interface SubscriptionWsiSuppressedObjects {
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

export interface WsiEventNote {
  MessageText: string;
  Time: Date;
  UserName: string;
}

export interface SubscriptionWsiProcedure {
  Id: string;
  Key: string;
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}

export interface EventCategoryWsi {
  CategoryId: number;
  CategoryName: string;
}

/* eslint-enable @typescript-eslint/naming-convention */
