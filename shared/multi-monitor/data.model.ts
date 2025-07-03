export class EventMessage {
  public type: EventMessageType = EventMessageType.None;
  public data: any;
}

export class ObjectMessage {
  public type: ObjectMessageType = ObjectMessageType.None;
  public data: any;
}

export enum EventMessageType {
  None,
  EventFiltering
}

export enum ObjectMessageType {
  None,
  SwitchFrame,
  ChangeMode,
  SystemBrowserFilter,
  Logout,
  SendSelectionMessage
}
