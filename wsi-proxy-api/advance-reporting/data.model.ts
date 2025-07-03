/* eslint-disable @typescript-eslint/naming-convention */
export interface ParameterDetails {
  parameters: ParametersMetaData[];
}
export interface ParametersMetaData {
  controlType: string;
  dataType: string;
  defaultvalue: string;
  fixedOrder: true;
  Hidden: boolean;
  locale: string;
  name: string;
  paramterType: number;
  Required: boolean;
  scalarParameterType?: string;
  promptText?: string;
  selectionList?: selectionList [];
  CascadingGroup?: string;
}
export interface selectionList {
  key: string;
  localeText: string;
}
export interface CascadingOptions {
  items: selectionList[];
}
export interface ExecuteApiParams {
  systemId: number;
  ruleId: string;
  parameters: ExecuteParameters;
  selectionContext: string;
  fileName: string;
  fileExt: string;
  objectId: string;
}

export interface ExecuteParameters {
  Parameters: ParametersData[];
  Section: string;
}

export interface ParametersData {
  ParamId: string;
  ParamValue: any;
}

/* eslint-disable @typescript-eslint/naming-convention */
