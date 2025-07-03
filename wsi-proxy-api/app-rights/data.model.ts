/* eslint-disable @typescript-eslint/naming-convention */

export interface Operation {
  Name: string;
  Id: number;
}
export interface ApplicationRight {
  Name: string;
  Id: number;
  Operations: Operation[];
}

export interface AppRights {
  ApplicationRights: ApplicationRight[];
}

/* eslint-enable @typescript-eslint/naming-convention */
