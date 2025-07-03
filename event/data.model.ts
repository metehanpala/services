import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { WSIProcedure, WSIStep } from '../wsi-proxy-api/assisted-treatment/data.model';
import { AutomaticTreatmentData, EventCommand, EventDetailsList, EventSoundWsi, ResoundCategory, WSIEvent } from '../wsi-proxy-api/event/data.model';
import { Link } from '../wsi-proxy-api/shared/data.model';
import { EventColors } from '../wsi-proxy-api/tables/data.model';

export class ConsumerInfo {
  public constructor(
    public eventsSubject: BehaviorSubject<Event[] | null>,
    public filterSubject: BehaviorSubject<EventFilter | null>,
    public connectionStateSubject: Subject<string>,
    public referenceCounter: number,
    public subcription: EventSubscription
  ) {}
}

export class EventSubscription {
  public constructor(
    public id: number,
    public events: Observable<Event[] | null>,
    public filter: Observable<EventFilter | null>,
    public connectionState: Observable<string>
  ) {}
}

export enum EventDateTimeFilterValues {
  None,
  LastQuarterHour,
  LastHalfHour,
  LastHour,
  LastNight,
  Yesterday,
  Today,
  Custom
}

export enum EventStates {
  Unprocessed,
  ReadyToBeReset,
  ReadyToBeClosed,
  WaitingOPCompletion,
  Acked,
  WaitingForCommandExecution,
  Closed,
  UnprocessedWithTimer,
  ReadyToBeResetWithTimer
}

export class EventFilter {
  public constructor(
    public empty: boolean,
    public eventId?: number[],
    public categories?: number[],
    public disciplines?: number[],
    public states?: string[],
    public srcState?: string[],
    public srcAlias?: string,
    public srcDesignations?: string[],
    public srcName?: string,
    public srcDescriptor?: string,
    public srcSystem?: number[],
    public informationalText?: string,
    public creationDateTime?: EventDateTimeFilterValues,
    public from?: Date,
    public to?: Date,
    public hiddenEvents?: boolean,
    public srcPropertyIds?: string[],
    public id?: string,
    public filterName?: string) {}

}

export class Category {
  public constructor(
    public id: number,
    public descriptor: string,
    public colors?: Map<EventColors, string>) {
  }
  public toString(): string {
    let colors = '';
    if (this.colors != undefined) {
      this.colors.forEach((value, key) => {
        colors = colors + ' ' + EventColors[key] + '=' + value + '; ';
      });
    }
    return `Category: id=${this.id}; name=${this.descriptor}: colors=${colors}`;
  }
}

export enum SortingDirection {
  NONE,
  DESCENDING,
  ASCENDING
}

export class EventSortingField {
  public constructor(
    public id: string,
    public order: number,
    public sortingDir: SortingDirection = SortingDirection.NONE) {
  }

  public toString(): string {
    return `${this.id}, ${this.order}, ${this.sortingDir};`;
  }

  public fromString(settings: string): EventSortingField {
    const eventsortingField: EventSortingField = new EventSortingField(settings[0], +settings[1], +settings[2]);
    return eventsortingField;
  }
}

export class SubDiscipline {
  public constructor(
    public id: number | undefined,
    public descriptor: string | undefined,
    public icon?: string) {
  }
  public toString(): string {
    return `Discipline: id=${this.id}; name=${this.descriptor}`;
  }
}

export class Discipline {
  public constructor(
    public id: number,
    public descriptor: string,
    public icon?: string | undefined,
    public subDisciplines?: SubDiscipline[]) {
  }
  public toString(): string {
    return `Discipline: id=${this.id}; name=${this.descriptor}`;
  }
}

export class Event {
  public static webClientString = 'Webclient';

  public categoryDescriptor: string | undefined;
  public categoryId: number | undefined;
  public cause: string | undefined;
  public commands: EventCommand[] | undefined;
  public creationTime: string | undefined;
  public deleted: boolean | undefined;
  public descriptionList: EventDetailsList[] | undefined;
  public descriptionLocationsList: EventDetailsList[] | undefined;
  public designationList: EventDetailsList[] | undefined;
  public direction: string | undefined;
  public eventId: number | undefined;
  public id: string | undefined;
  public infoDescriptor: string | undefined;
  public inProcessBy: string | undefined;
  public originalInProcessBy: string | undefined;
  public messageText: string[] | undefined;
  public messageTextToDisplay: string | undefined;
  public nextCommand: string | undefined;
  public sound: string | undefined;
  public sourceDesignationList: EventDetailsList[] | undefined;
  public srcDescriptor: string | undefined;
  public srcDesignation: string | undefined;
  public srcDisciplineDescriptor: string | undefined;
  public srcDisciplineId: number | undefined;
  public srcLocation: string | undefined;
  public srcName: string | undefined;
  public srcObservedPropertyId: string | undefined;
  public srcPropertyId: string | undefined;
  public srcState: string | undefined;
  public srcSubDisciplineId: number | undefined;
  public srcSystemId: number | undefined;
  public srcViewDescriptor: string | undefined;
  public srcViewName: string | undefined;
  public srcSource: string[] | undefined;
  public sourceFltr: string | undefined;
  public state: string | undefined;
  public suggestedAction: string | undefined;
  public srcSystemName: string | undefined;
  public srcAlias: string | undefined;
  public oPId: string | undefined;
  public treatmentType: string | undefined;
  public informationalText: string | undefined;
  public eventText: string | undefined;

  public groupedEvents: Event[] = [];
  public container: Event | undefined;

  public category: Category | null | undefined;
  public customData: any;
  public icon: string | undefined;
  public groupId: string | undefined;

  public originalCreationTime: Date | undefined;
  public originalState: string | undefined;
  public statePriority: number | undefined;
  public stateId: EventStates | undefined;
  public suggestedActionId: number | undefined;
  public srcStateId: number | undefined;
  public closedForFilter: boolean | undefined;
  public timerUtc: string | undefined;
  public belongsTo: string | undefined;
  public belongsToFltr: string | undefined;
  public automaticTreatmentData: AutomaticTreatmentData | undefined;

  public updateEvent(event: Event, updateGroupId = true, manageGroupedEvents?: boolean): void {
    this.categoryDescriptor = event.categoryDescriptor;
    this.categoryId = event.categoryId;
    this.cause = event.cause;
    this.commands = event.commands;
    this.creationTime = event.creationTime;
    this.originalCreationTime = event.originalCreationTime;
    this.deleted = event.deleted;
    this.descriptionList = event.descriptionList;
    this.descriptionLocationsList = event.descriptionLocationsList;
    this.designationList = event.designationList;
    this.direction = event.direction;
    this.eventId = event.eventId;
    this.id = event.id;
    this.infoDescriptor = event.infoDescriptor;
    this.inProcessBy = this.splitIdHash(event.inProcessBy!);
    this.originalInProcessBy = event.inProcessBy!;
    this.messageText = event.messageText;
    this.messageTextToDisplay = event.messageTextToDisplay;
    this.nextCommand = event.nextCommand;
    this.sound = event.sound;
    this.sourceDesignationList = event.sourceDesignationList;
    this.srcDescriptor = event.srcDescriptor;
    this.srcDesignation = event.srcDesignation;
    this.srcDisciplineDescriptor = event.srcDisciplineDescriptor;
    this.srcDisciplineId = event.srcDisciplineId;
    this.srcLocation = event.srcLocation;
    this.srcName = event.srcName;
    this.srcObservedPropertyId = event.srcObservedPropertyId;
    this.srcPropertyId = event.srcPropertyId;
    this.srcState = event.srcState;
    this.srcSubDisciplineId = event.srcSubDisciplineId;
    this.srcSystemId = event.srcSystemId;
    this.srcViewDescriptor = event.srcViewDescriptor;
    this.srcViewName = event.srcViewName;
    this.state = event.state;
    this.suggestedAction = event.suggestedAction;
    this.srcSystemName = event.srcSystemName;
    this.messageTextToDisplay = this.getLastMessageText();
    this.srcAlias = event.srcAlias;
    this.oPId = event.oPId;
    this.treatmentType = event.inProcessBy !== undefined ? event.inProcessBy.charAt(0) : undefined;
    this.informationalText = event.informationalText;
    this.eventText = event.eventText;
    this.timerUtc = event.timerUtc;
    this.belongsTo = event.belongsTo;
    this.belongsToFltr = event.belongsToFltr;

    this.suggestedActionId = event.suggestedActionId;
    this.statePriority = event.statePriority;
    this.stateId = event.stateId;
    this.srcStateId = event.srcStateId;
    this.category = event.category;
    this.icon = event.icon;
    this.customData = event.customData;
    this.automaticTreatmentData = event.automaticTreatmentData;

    if (manageGroupedEvents !== undefined) {
      if (manageGroupedEvents) {
        this.groupId = event.srcPropertyId!.substr(0, event.srcPropertyId!.lastIndexOf(':') + 1) + event.categoryId;
      } else {
        this.groupId = event.eventId + '#' + event.srcSystemId;
      }
      return;
    }

    if (updateGroupId) {
      this.groupId = event.groupId;
    }
  }

  public setInitialValuesFromWSIEvent(wsiEvent: WSIEvent, category: Category | null, icon: string | undefined, webClientInProcessBy: string = ''): void {
    this.categoryDescriptor = wsiEvent.CategoryDescriptor;
    this.categoryId = wsiEvent.CategoryId;
    this.cause = wsiEvent.Cause;
    this.commands = wsiEvent.Commands;
    this.creationTime = wsiEvent.CreationTime;
    this.deleted = wsiEvent.Deleted;
    this.descriptionList = wsiEvent.DescriptionList;
    this.descriptionLocationsList = wsiEvent.DescriptionLocationsList;
    this.designationList = wsiEvent.DesignationList;
    this.direction = wsiEvent.Direction;
    this.eventId = wsiEvent.EventId;
    this.id = wsiEvent.Id;
    this.infoDescriptor = wsiEvent.InfoDescriptor;
    this.inProcessBy = this.splitIdHash(wsiEvent.InProcessBy);
    this.originalInProcessBy = wsiEvent.InProcessBy;
    this.messageText = wsiEvent.MessageText;
    this.nextCommand = wsiEvent.NextCommand;
    this.sound = wsiEvent.Sound;
    this.sourceDesignationList = wsiEvent.SourceDesignationList;
    this.srcDescriptor = wsiEvent.SrcDescriptor;
    this.srcDesignation = this.removeLastNode(wsiEvent.SrcDesignation);
    this.srcDisciplineDescriptor = wsiEvent.SrcDisciplineDescriptor;
    this.srcDisciplineId = wsiEvent.SrcDisciplineId;
    this.srcLocation = this.removeLastNode(wsiEvent.SrcLocation);
    this.srcName = wsiEvent.SrcName;
    this.srcObservedPropertyId = wsiEvent.SrcObservedPropertyId;
    this.srcPropertyId = wsiEvent.SrcPropertyId;
    this.srcState = wsiEvent.SrcState;
    this.srcSubDisciplineId = wsiEvent.SrcSubDisciplineId;
    this.srcSystemId = wsiEvent.SrcSystemId;
    this.srcViewDescriptor = wsiEvent.SrcViewDescriptor;
    this.srcViewName = wsiEvent.SrcViewName;
    this.state = wsiEvent.State;
    this.originalState = wsiEvent.State;
    this.suggestedAction = wsiEvent.SuggestedAction;
    this.srcSystemName = wsiEvent.SrcSystemName;
    this.srcAlias = wsiEvent.SrcAlias;
    this.oPId = wsiEvent.OperatingProcedureId;
    this.informationalText = wsiEvent.InformationText;
    this.timerUtc = wsiEvent.Timer;
    this.category = category;
    this.icon = icon;
    this.automaticTreatmentData = wsiEvent.AutomaticTreatmentData;
    this.belongsTo = this.extractBelongsTo(wsiEvent.SrcPropertyId);
    this.belongsToFltr = this.belongsTo;
    this.suggestedActionId = this.getSuggestedActionId(this.suggestedAction);
    this.statePriority = this.getStatePriority(this.state);
    this.srcStateId = this.getSrcStateId(this.srcState);
    this.stateId = this.getStateId(this.state);
    this.addMillisecondsToCreationTime();

    if (this.srcSystemName === undefined) {
      this.srcSystemName = this.srcPropertyId.split(':')[0];
    }
  }

  public updateFromWsiEvent(wsiEvent: WSIEvent): void {
    this.categoryDescriptor = wsiEvent.CategoryDescriptor;
    this.categoryId = wsiEvent.CategoryId;
    this.cause = wsiEvent.Cause;
    this.commands = wsiEvent.Commands;
    this.deleted = wsiEvent.Deleted;
    this.descriptionList = wsiEvent.DescriptionList;
    this.descriptionLocationsList = wsiEvent.DescriptionLocationsList;
    this.designationList = wsiEvent.DesignationList;
    this.direction = wsiEvent.Direction;
    this.eventId = wsiEvent.EventId;
    this.id = wsiEvent.Id;
    this.infoDescriptor = wsiEvent.InfoDescriptor;
    this.inProcessBy = wsiEvent.InProcessBy;
    this.originalInProcessBy = wsiEvent.InProcessBy;
    this.messageText = wsiEvent.MessageText;
    this.nextCommand = wsiEvent.NextCommand;
    this.sound = wsiEvent.Sound;
    this.sourceDesignationList = wsiEvent.SourceDesignationList;
    this.srcDescriptor = wsiEvent.SrcDescriptor;
    this.srcDesignation = this.removeLastNode(wsiEvent.SrcDesignation);
    this.srcDisciplineDescriptor = wsiEvent.SrcDisciplineDescriptor;
    this.srcDisciplineId = wsiEvent.SrcDisciplineId;
    this.srcLocation = this.removeLastNode(wsiEvent.SrcLocation);
    this.srcName = wsiEvent.SrcName;
    this.srcObservedPropertyId = wsiEvent.SrcObservedPropertyId;
    this.srcPropertyId = wsiEvent.SrcPropertyId;
    this.srcState = wsiEvent.SrcState;
    this.srcSubDisciplineId = wsiEvent.SrcSubDisciplineId;
    this.srcSystemId = wsiEvent.SrcSystemId;
    this.srcViewDescriptor = wsiEvent.SrcViewDescriptor;
    this.srcViewName = wsiEvent.SrcViewName;
    this.state = wsiEvent.State;
    this.originalState = wsiEvent.State;
    this.suggestedAction = wsiEvent.SuggestedAction;
    this.srcSystemName = wsiEvent.SrcSystemName;
    this.srcAlias = wsiEvent.SrcAlias;
    this.oPId = wsiEvent.OperatingProcedureId;
    this.informationalText = wsiEvent.InformationText;
    this.timerUtc = wsiEvent.Timer;
    this.automaticTreatmentData = wsiEvent.AutomaticTreatmentData;

    this.belongsTo = this.extractBelongsTo(wsiEvent.SrcPropertyId);
    this.belongsToFltr = this.belongsTo;
    this.suggestedActionId = this.getSuggestedActionId(this.suggestedAction);
    this.statePriority = this.getStatePriority(this.state);
    this.stateId = this.getStateId(this.state);
    this.srcStateId = this.getSrcStateId(this.srcState);
    this.closedForFilter = false;

    if (this.srcSystemName === undefined) {
      this.srcSystemName = this.srcPropertyId.split(':')[0];
    }
  }

  public removeLastNode(path: string): string {
    let fieldValue = '';

    if (path != undefined) {
      const pos: number = path.lastIndexOf('.');
      fieldValue = (pos > 0) ? path.substr(0, pos) : path;
    }

    return fieldValue;
  }

  public resetState(filteredEvents = false): void {
    this.state = this.originalState;
    this.stateId = this.getStateId(this.state!);
    if (filteredEvents) {
      this.closedForFilter = false;
    }
  }

  public markAsClosed(): void {
    this.state = 'Closed';
    this.stateId = EventStates.Closed;
    this.closedForFilter = true;
  }

  public getAssistedTreatmentInProcessBy(): string | undefined {
    const web: string = Event.webClientString;

    const str = this.originalInProcessBy;
    if (str) {
      const allInProcessBy = str.split('\\\\');
      const result = allInProcessBy.find(s => s.startsWith('3#'));
      if (result) {
        return result?.substring(2, result.length).replace('_#WEBCLIENT#_', web);
      } else {
        return str;
      }
    }

    return undefined;
  }
  private splitIdHash(str: string): string | undefined {
    const web: string = Event.webClientString;

    if (str) {
      // we will change the string only if it start with a number
      return str
        .split('\\\\')
        .map(x => !Number.isNaN(Number.parseInt(x.substring(0, 1))) ? x.slice(2, str.length).replace('_#WEBCLIENT#_', web) : x)
        .join(', ');
    } else {
      return undefined;
    }
  }

  // private extractDpID(srcPropId: string): string {
  //   const subString: string = srcPropId.substr(0, srcPropId.lastIndexOf(":"));
  //   return subString.substr(0, subString.lastIndexOf("."));
  // }

  private extractBelongsTo(srcPropId: string): string {
    const subString: string = srcPropId.substr(0, srcPropId.lastIndexOf(':'));
    return subString.substr(0, subString.lastIndexOf('.'));
  }

  private getLastMessageText(): string | undefined {
    if (this.messageText === undefined || this.messageText.length === 0) {
      return this.cause;
    }
    for (let i: number = this.messageText.length - 1; i >= 0; i--) {
      const lastMessageText: string = this.messageText[i];
      if (lastMessageText !== undefined && lastMessageText !== '') {
        return lastMessageText;
      }
    }
    return this.cause;
  }

  private addMillisecondsToCreationTime(): void {
    const timeStamp: Date = new Date(Date.parse(this.creationTime!));
    this.originalCreationTime = timeStamp;

    let timeStampStr: string = timeStamp.toLocaleString();

    if (timeStampStr.endsWith('M')) {
      const ampm: string = timeStampStr.substr(timeStampStr.length - 2, 2);
      timeStampStr = timeStampStr.substring(0, timeStampStr.length - 2) + '.' + timeStamp.getMilliseconds() + ' ' + ampm;
    } else {
      timeStampStr = timeStampStr + '.' + timeStamp.getMilliseconds();
    }
    this.creationTime = timeStampStr;
  }

  private getStatePriority(state: string): number | undefined {
    if (state === 'Unprocessed' || state === 'UnprocessedWithTimer') {
      return 0;
    } else if (state === 'ReadyToBeReset' || state === 'ReadyToBeResetWithTimer') {
      return 1;
    } else if (state === 'ReadyToBeClosed') {
      return 2;
    } else if (state === 'WaitingOPCompletion') {
      return 3;
    } else if (state === 'Acked') {
      return 4;
    } else if (state === 'WaitingForCommandExecution') {
      return 5;
    } else {
      return undefined;
    }
  }

  private getStateId(state: string): EventStates | undefined {
    if (state === 'Unprocessed') {
      return EventStates.Unprocessed;
    } else if (state === 'UnprocessedWithTimer') {
      return EventStates.UnprocessedWithTimer;
    } else if (state === 'ReadyToBeReset') {
      return EventStates.ReadyToBeReset;
    } else if (state === 'ReadyToBeResetWithTimer') {
      return EventStates.ReadyToBeResetWithTimer;
    } else if (state === 'ReadyToBeClosed') {
      return EventStates.ReadyToBeClosed;
    } else if (state === 'WaitingOPCompletion') {
      return EventStates.WaitingOPCompletion;
    } else if (state === 'Acked') {
      return EventStates.Acked;
    } else if (state === 'WaitingForCommandExecution') {
      return EventStates.WaitingForCommandExecution;
    } else if (state === 'Closed') {
      return EventStates.Closed;
    } else {
      return undefined;
    }
  }

  private getSrcStateId(srcState: string): number | undefined {
    if (srcState === 'Active') {
      return 0;
    } else if (srcState === 'Quiet') {
      return 1;
    } else {
      return undefined;
    }
  }

  private getSuggestedActionId(suggAction: string): number | undefined {
    if (suggAction === 'Acknowledge') {
      return 0;
    } else if (suggAction === 'Silence') {
      return 1;
    } else if (suggAction === 'WaitForCommandExecution') {
      return 2;
    } else if (suggAction === 'Suspend') {
      return 3;
    } else if (suggAction === 'Reset') {
      return 4;
    } else if (suggAction === 'Close') {
      return 5;
    } else if (suggAction === 'CompleteOP') {
      return 6;
    } else if (suggAction === 'WaitforCondition') {
      return 7;
    } else if (suggAction === 'None') {
      return 8;
    } else {
      return undefined;
    }
  }
}

/* eslint-disable @typescript-eslint/naming-convention */

export interface EventList {
  Events: Event[];
  Page: number;
  Total: number;
  _links: Link[];
}

/* eslint-enable @typescript-eslint/naming-convention */

export class HdrItem {
  public constructor(
    public id: string,
    public visible: boolean
  ) {
  }
}
export class EventSound {
  public sound: string | undefined;
  constructor(private readonly eventSound: EventSoundWsi) {
  }

  public get fileName(): string {
    return this.eventSound.FileName;
  }

  public get resoundData(): ResoundCategory[] {
    return this.eventSound.ResoundData;
  }

  public get visibility(): number {
    return this.eventSound.Visibility;
  }

  public get links(): Link[] {
    return this.eventSound._links;
  }
}

export class OPStep {
  public attributes: string | undefined;
  public name: string | undefined;
  public num: number | undefined;
  public operator: string | undefined;
  public attachments: string | undefined;
  public visibility: boolean | undefined;
  public executionType: number | undefined;
  public isEnabled: boolean | undefined;
  public isSelected: boolean | undefined;
  public isCheckBtnEnabled: boolean | undefined;
  public hasConfirmedExecution: boolean | undefined;
  public mustConfirmExecution: boolean | undefined;
  public isCompleted: boolean | undefined;
  public isManual: boolean | undefined;
  public state: boolean | undefined;
  public runtimeStatus: string | undefined;
  public step: Step | undefined;
  public managedType: string | undefined;
  public isMandatory: boolean | undefined;
  public stepId: string | undefined;
}

export class Step {
  public attachments: string | undefined;
  public attributes: string | undefined;
  public automaticDPE: string | undefined;
  public configuration: string | undefined;
  public errorText: string | undefined;
  public fixedLink: string | undefined;
  public hasConfirmedExecution: boolean | undefined;
  public isCompleted: boolean | undefined;
  public managedType: string | undefined;
  public notes: string | undefined;
  public operator: string | undefined;
  public runtimeStatus: string | undefined;
  public status: string | undefined;
  public stepId: string | undefined;
  public stepName: string | undefined;
}

export class Procedure {
  public alertCount: number | undefined;
  public alertSource: string | undefined;
  public alertTime: Date | undefined;
  public id: string | undefined;
  public isClosed: boolean | undefined;
  public resetSteps: number | undefined;
  public sequential: boolean | undefined;
  public steps: Step[] | undefined;
  public subsequent: number | undefined;

  public initializeFromWSIProcedure(wsiProcedure: WSIProcedure): void {
    this.alertCount = wsiProcedure.AlertCount;
    this.alertSource = wsiProcedure.AlertSource;
    this.alertCount = wsiProcedure.AlertCount;
    this.id = wsiProcedure.Id;
    this.isClosed = wsiProcedure.IsClosed;
    this.resetSteps = wsiProcedure.ResetSteps;
    this.sequential = wsiProcedure.Sequential;
    this.steps = this.initializeFromWSISteps(wsiProcedure.Steps);
    this.subsequent = wsiProcedure.Subsequent;
  }

  public initializeFromWSISteps(wsiSteps: WSIStep[]): Step[] {
    let currStep: Step;
    const procedureSteps: Step[] = [];

    wsiSteps.forEach(step => {
      currStep = new Step();

      currStep.attachments = step.Attachments;
      currStep.attributes = step.Attributes;
      currStep.automaticDPE = step.AutomaticDPE;
      currStep.configuration = step.Configuration;
      currStep.errorText = step.ErrorText;
      currStep.fixedLink = step.FixedLink;
      currStep.hasConfirmedExecution = step.HasConfirmedExecution;
      currStep.isCompleted = step.IsCompleted;
      currStep.managedType = step.ManagedType;
      currStep.notes = step.Notes;
      currStep.operator = step.Operator;
      currStep.runtimeStatus = step.RuntimeStatus;
      currStep.status = step.Status;
      currStep.stepId = step.StepId;
      currStep.stepName = step.StepName;

      procedureSteps.push(currStep);
    });

    return procedureSteps;
  }
}
export class AutoTreatStruct {
  public event: Event | undefined;
  public isEventSelectedInEL: boolean | undefined;
  public isHigherPrio: boolean | undefined;
}
