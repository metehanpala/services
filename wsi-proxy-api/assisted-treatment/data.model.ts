/* eslint-disable @typescript-eslint/naming-convention */

export interface WSIStep {
  Attachments: string;
  Attributes: string;
  AutomaticDPE: string;
  Configuration: string;
  ErrorText: string;
  FixedLink: string;
  HasConfirmedExecution: boolean;
  IsCompleted: boolean;
  ManagedType: string;
  Notes: string;
  Operator: string;
  RuntimeStatus: string;
  Status: string;
  StepId: string;
  StepName: string;
}

export interface WSIProcedure {
  AlertCount: number;
  AlertSource: string;
  AlertTime: Date;
  Id: string;
  IsClosed: boolean;
  ResetSteps: number;
  Sequential: boolean;
  Steps: WSIStep[];
  Subsequent: number;
}

/* eslint-enable @typescript-eslint/naming-convention */
