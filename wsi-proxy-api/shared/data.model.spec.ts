import { ObjectAttributes, PropertyDetails, PropertyInfo, ValidationRules, Value } from './data.model';
import { PropertyInfoUtility } from './property-info-utility';

/* eslint-disable @typescript-eslint/naming-convention */

const objectAttributes: ObjectAttributes[] = [
  {
    Alias: 'alias',
    DefaultProperty: 'defaultProperty',
    DisciplineDescriptor: 'disciplineDescriptor',
    DisciplineId: 1,
    FunctionName: 'functionName',
    ManagedType: 1,
    ManagedTypeName: 'managedTypeName',
    ObjectId: 'objectId',
    SubDisciplineDescriptor: 'subDisciplineDescriptor',
    SubDisciplineId: 2,
    SubTypeDescriptor: 'subTypeDescriptor',
    SubTypeId: 3,
    TypeDescriptor: 'typeDescriptor',
    TypeId: 4,
    ObjectModelName: 'objectModelName'
  },
  {
    Alias: 'alias',
    DefaultProperty: 'defaultProperty',
    DisciplineDescriptor: 'disciplineDescriptor',
    DisciplineId: 1,
    FunctionName: 'functionName',
    ManagedType: 1,
    ManagedTypeName: 'managedTypeName',
    ObjectId: 'objectId',
    SubDisciplineDescriptor: 'subDisciplineDescriptor',
    SubDisciplineId: 2,
    SubTypeDescriptor: 'subTypeDescriptor',
    SubTypeId: 3,
    TypeDescriptor: 'typeDescriptor',
    TypeId: 4,
    ObjectModelName: 'objectModelName'
  }
];

const values: Value[] = [
  {
    Value: 'value1',
    DisplayValue: 'displayValue1',
    Timestamp: 'timestamp1',
    QualityGood: true,
    Quality: 'quality1'
  },
  {
    Value: 'value2',
    DisplayValue: 'displayValue2',
    Timestamp: 'timestamp2',
    QualityGood: false,
    Quality: 'quality2'
  }
];

const propertyDetails: PropertyDetails[] = [
  {
    PropertyName: 'propertyName1',
    Descriptor: 'descriptor1',
    IsArray: false,
    Min: 'min1',
    Max: 'max1',
    Order: 1,
    Resolution: 2,
    UnitDescriptor: 'unitDescriptor1',
    UnitId: 3,
    Usage: 3,
    Type: 'type1',
    Value: values[0]
  },
  {
    PropertyName: 'propertyName2',
    Descriptor: 'descriptor2',
    IsArray: false,
    Min: 'min2',
    Max: 'max2',
    Order: 5,
    Resolution: 6,
    UnitDescriptor: 'unitDescriptor2',
    UnitId: 7,
    Usage: 8,
    Type: 'type2',
    Value: values[1]
  }
];

const propertyInfoStrings: PropertyInfo<string>[] = [
  {
    ErrorCode: 1,
    ObjectId: 'objectId1',
    Attributes: objectAttributes[0],
    Properties: ['property1', 'property2'],
    FunctionProperties: ['functionProperties1', 'functionProperties2']
  },
  {
    ErrorCode: 2,
    ObjectId: 'objectId2',
    Attributes: objectAttributes[1],
    Properties: ['property3', 'property4'],
    FunctionProperties: ['functionProperties3', 'functionProperties4']
  }
];

const propertyInfoDetails: PropertyInfo<PropertyDetails>[] = [
  {
    ErrorCode: 0,
    ObjectId: 'objectId1',
    Attributes: objectAttributes[0],
    Properties: propertyDetails,
    FunctionProperties: propertyDetails
  },
  {
    ErrorCode: 0,
    ObjectId: 'objectId2',
    Attributes: objectAttributes[1],
    Properties: propertyDetails,
    FunctionProperties: propertyDetails
  },
  {
    ErrorCode: 0,
    ObjectId: 'objectId3',
    Attributes: objectAttributes[0],
    Properties: propertyDetails,
    FunctionProperties: propertyDetails
  },
  {
    ErrorCode: 0,
    ObjectId: 'objectId4',
    Attributes: objectAttributes[1],
    Properties: propertyDetails,
    FunctionProperties: propertyDetails
  }
];

const validationRules: ValidationRules[] = [
  {
    PredefinedCommentsId: 'TxG_Apogee_ACTIVE_NTRAL',
    CommentRule: 'Mandatory',
    ReAuthentication: 'NoNeed',
    Configuration: 1,
    IsFourEyesEnabled: false
  },
  {
    PredefinedCommentsId: 'TxG_Apogee_ACTIVE_NTRAL',
    CommentRule: 'Optional',
    ReAuthentication: 'NoNeed',
    Configuration: 0,
    IsFourEyesEnabled: false
  },
  {
    PredefinedCommentsId: '',
    CommentRule: 'Mandatory',
    ReAuthentication: 'ReenterPw',
    Configuration: 2,
    IsFourEyesEnabled: true
  }
];

/* eslint-enable @typescript-eslint/naming-convention */

// Tests  /////////////
describe('System-browser Data Model', () => {

  it('has getTrace', () => {
    PropertyInfoUtility.getTrace2(propertyInfoDetails);
    PropertyInfoUtility.getTrace3(propertyInfoStrings[0]);
    PropertyInfoUtility.getTrace4(propertyDetails);
    PropertyInfoUtility.getTrace5(propertyDetails[0]);
    PropertyInfoUtility.getTrace6(objectAttributes[0]);
    PropertyInfoUtility.getTrace7(propertyInfoStrings[0]);
  });
});

describe('Validation Rules Data Model', () => {
  it('has getTrace', () => {
    const validationTraces: string[] = [];
    validationRules.forEach(rules => {
      const trace = `CommentRule: ${rules.CommentRule}\nCommentRule: ${rules.ReAuthentication}\n
      Configuration: ${rules.Configuration}\nIsFourEyesEnabled:${rules.IsFourEyesEnabled}\nPredefinedCommentsId:${rules.PredefinedCommentsId}`;
      validationTraces.push(trace);
    });
    expect(validationRules.length).toBe(3);
  });
});
