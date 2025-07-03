/* eslint-disable @typescript-eslint/naming-convention */

export interface LocalTextGroupEntry {
  Value: number;
  Text: string;
  Color: number;
}

export interface DisciplineWithSubgroup {
  DisciplineId: number;
  DisciplineDescriptor: string;
  SubDisciplines: { Id: number; Descriptor: string }[];
}

export interface ObjectTypeWithSubgroup {
  ObjectTypeId: number;
  ObjectTypeDescriptor: string;
  SubObjectTypes: { Id: number; Descriptor: string }[];
}

/* eslint-enable @typescript-eslint/naming-convention */

export enum Tables {
  Disciplines = 'disciplines',
  SubDisciplines = 'subdisciplines',
  Categories = 'categories',
  ObjectTypes = 'objecttypes',
  ObjectSubTypes = 'objectsubtypes',
  Units = 'units'
}

export enum SubTables {
  Colors = 'colors',
  Icons = 'icons'
}

export enum EventColors {
  TextButtonNormal = 1,
  TextButtonPressed,
  TextEventSelected,
  TextEventNormal,
  TextEventHover,
  ButtonGradientBright,
  ButtonGradientDark,
  ButtonPressedGradientBright,
  ButtonPressedGradientDark,
  ButtonBlinkingBright,
  ButtonBlinkingDark,
  EventDescriptorSelected,
  EventDescriptorNormal
}

/**
 * Icon image.
 */
export interface IconImage {
  imageFormat: string;
  image: string;
}

/**
 * Represents a entry from a text-table.
 */
export class TextEntry {
  private readonly _subText: TextEntry[] | null = null;

  public get value(): number {
    return this._value;
  }

  public get text(): string {
    return this._text;
  }

  public get subText(): TextEntry[] | null {
    return this._subText;
  }

  /**
   * Compare two text entry instances for equality.
   * @param x
   * @param y
   */
  public static isEqual(x: TextEntry, y: TextEntry): boolean {
    if (x == undefined) {
      return y == undefined;
    }
    return x.isEqual(y);
  }

  /**
   * Compare two text entry arrays for equality.
   * Array entries do NOT have to be in the same order to be equal.
   * Assumes arrays entries are all defined.
   * @param xArr
   * @param yArr
   */
  public static isEqualArr(xArr: TextEntry[] | null, yArr: TextEntry[] | null): boolean {
    if (xArr == undefined) {
      return yArr == undefined;
    } else if (yArr == undefined) {
      return false;
    } else if (xArr.length !== yArr.length) {
      return false;
    }

    for (const x of xArr) {
      const y: TextEntry | undefined = yArr.find((entry: TextEntry) => entry.isEqual(x));
      if (y == undefined) {
        return false;
      }
    }
    for (const y of yArr) {
      const x: TextEntry | undefined = xArr.find((entry: TextEntry) => entry.value === y.value);
      if (x == undefined) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert the provided array of text entries w/ optional sub-text to an object
   * of the shape expected by the WSI CNS search request.
   * @param arr
   */
  public static arrayAsWsiParam(arr: TextEntry[]): any {
    if (arr == undefined) {
      return undefined;
    }
    const obj: any = {};
    for (const e of arr) {
      const subVals: number[] = [];
      if (e.subText != undefined) {
        e.subText.forEach((subT: TextEntry) => subVals.push(subT.value));
      }
      obj[e.value] = subVals;
    }
    return obj;
  }

  /**
   * Constructor.
   * @param _value
   * @param _text
   * @param subT
   */
  public constructor(
    private readonly _value: number,
    private readonly _text: string,
    subT?: TextEntry[] | null) {

    if (subT != undefined) {
      this._subText = subT;
    }
  }

  /**
   * Compare this text entry instance to another for equality.
   * @param that
   */
  public isEqual(that: TextEntry): boolean {
    if (that == undefined) {
      return false;
    }

    return (
      this.value === that.value &&
      this.text === that.text &&
      TextEntry.isEqualArr(this.subText, that.subText)
    );
  }
}
