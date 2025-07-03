import { ObjectAttributes, PropertyDetails, PropertyInfo } from '../shared/data.model';

export class PropertyInfoUtility {
  public static getTrace1(propertyInfo: PropertyInfo<PropertyDetails>): string {
    return `ObjectId=${propertyInfo.ObjectId}\nErrorCode=${propertyInfo.ErrorCode}\nAttributes:${
      PropertyInfoUtility.getTrace6(propertyInfo.Attributes)}\nProperties:${
      PropertyInfoUtility.getTrace4(propertyInfo.Properties)}\nFunction properties:${
      PropertyInfoUtility.getTrace4(propertyInfo.FunctionProperties)}`;
  }

  public static getTrace2(propertyInfos: PropertyInfo<PropertyDetails>[]): string {
    let trcStr = '';
    propertyInfos.forEach(propInfo => {
      trcStr = trcStr + '\n' + PropertyInfoUtility.getTrace1(propInfo);
    });
    return trcStr;
  }

  public static getTrace3(propertyInfo: PropertyInfo<string>): string {
    return '';
  }

  public static getTrace4(propertyDetails: PropertyDetails[]): string {
    let trcStr = '';
    if (propertyDetails != undefined) {
      propertyDetails.forEach(property => {
        trcStr = trcStr + PropertyInfoUtility.getTrace5(property);
      });
    }
    return trcStr;
  }

  public static getTrace5(propertyDetail: PropertyDetails): string {
    let strVal = '';
    if (propertyDetail.Value != undefined) {
      strVal =
        `Value=${propertyDetail.Value.Value}
        DisplayValue=${propertyDetail.Value.DisplayValue}
        Timestamp=${propertyDetail.Value.Timestamp}
        Quality=${propertyDetail.Value.Quality}
        QualityGood=${propertyDetail.Value.QualityGood}`;
    }

    const str =
      `
      PropertyName=${propertyDetail.PropertyName}
      Descriptor=${propertyDetail.Descriptor}
      Min=${propertyDetail.Min}
      Max=${propertyDetail.Max}
      Unit=${propertyDetail.UnitId}
      UnitDescriptor=${propertyDetail.UnitDescriptor}
      Order=${propertyDetail.Order}
      Resolution=${propertyDetail.Resolution}
      Type=${propertyDetail.Type}
      Usage=${propertyDetail.Usage}`;

    return `${str}
      ${strVal}`;
  }

  public static getTrace6(attributes: ObjectAttributes): string {
    let trcStr = '';
    if (attributes != undefined) {
      trcStr =
      `DefaultProperty=${attributes.DefaultProperty}
      Alias=${attributes.Alias}
      ObjectId=${attributes.ObjectId}
      ManagedType=${attributes.ManagedType}
      ManagedTypeName=${attributes.ManagedTypeName}
      DisciplineId=${attributes.DisciplineId}
      DisciplineDescriptor=${attributes.DisciplineDescriptor}
      SubDisciplineId=${attributes.SubDisciplineId}
      SubDisciplineDescriptor=${attributes.SubDisciplineDescriptor}
      TypeId=${attributes.TypeId}
      TypeDescriptor=${attributes.TypeDescriptor}
      SubTypeId=${attributes.SubTypeId}
      SubTypeDescriptor=${attributes.SubTypeDescriptor}
      FunctionName=${attributes.FunctionName}`;
    }
    return trcStr;
  }

  public static getTrace7(propertyInfo: PropertyInfo<string>): string {
    return `ObjectId=${propertyInfo.ObjectId}\nErrorCode=${propertyInfo.ErrorCode}\nProperties:${
      propertyInfo.Properties.toString()}\nFunction properties:${
      propertyInfo.FunctionProperties.toString()}`;
  }
}
