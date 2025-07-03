import { SubDiscipline } from '../event/data.model';

export const defaultIcon = 'element-special-object';

export enum TablesEx {
  Disciplines,
  SubDisciplines,
  ObjectTypes,
  ObjectSubTypes
}

export class ObjectType {
  public constructor(
    public id: number,
    public descriptor: string,
    public icon: string) {
  }
  public toString(): string {
    return `ObjectType: id=${this.id}; name=${this.descriptor}`;
  }
}

export class ObjectSubType {
  public constructor(
    public id: number,
    public descriptor: string,
    public icon: string) {
  }
  public toString(): string {
    return `ObjectSubType: id=${this.id}; name=${this.descriptor}`;
  }
}

export class DisciplineTable {
  public constructor(
    public id: number,
    public descriptor: string,
    public icon: string
  ) {}
  public toString(): string {
    return `Discipline: id=${this.id}; name=${this.descriptor}`;
  }
}

export interface TablesData {
  disciplines: DisciplineTable[];
  subdisciplines: SubDiscipline[];
  objecttypes: ObjectType[];
  subtypes: ObjectSubType[];
}
