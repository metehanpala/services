import { Injectable } from '@angular/core';
import { MockTraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { PropertyServiceBase } from '../wsi-proxy-api/properties/property.service.base';
import { ObjectAttributes, PropertyDetails, PropertyInfo, Value } from '../wsi-proxy-api/shared/data.model';

/**
 * GMS WSI value implementation.
 * @extends ValuerBase
 */
@Injectable({
  providedIn: 'root'
})
export class MockPropertyService extends PropertyServiceBase {

  /* eslint-disable @typescript-eslint/naming-convention */

  private readonly objectAttributes: ObjectAttributes[] =
    [
      {
        'Alias': 'alias',
        'DefaultProperty': 'defaultProperty',
        'DisciplineDescriptor': 'disciplineDescriptor',
        'DisciplineId': 1,
        'FunctionName': 'functionName',
        'ManagedType': 1,
        'ManagedTypeName': 'managedTypeName',
        'ObjectId': 'objectId',
        'SubDisciplineDescriptor': 'subDisciplineDescriptor',
        'SubDisciplineId': 2,
        'SubTypeDescriptor': 'subTypeDescriptor',
        'SubTypeId': 3,
        'TypeDescriptor': 'typeDescriptor',
        'TypeId': 4,
        'ObjectModelName': 'objectModelName'
      },
      {
        'Alias': 'alias',
        'DefaultProperty': 'defaultProperty',
        'DisciplineDescriptor': 'disciplineDescriptor',
        'DisciplineId': 5,
        'FunctionName': 'functionName',
        'ManagedType': 1,
        'ManagedTypeName': 'managedTypeName',
        'ObjectId': 'objectId',
        'SubDisciplineDescriptor': 'subDisciplineDescriptor',
        'SubDisciplineId': 6,
        'SubTypeDescriptor': 'subTypeDescriptor',
        'SubTypeId': 7,
        'TypeDescriptor': 'typeDescriptor',
        'TypeId': 8,
        'ObjectModelName': 'objectModelName'
      }
    ];

  private readonly values: Value[] =
    [
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

  private readonly propertyDetails: PropertyDetails[] =
    [
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
        Value: this.values[0]
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
        Value: this.values[1]
      }

    ];

  private readonly propertyInfoString: PropertyInfo<string>[] =
    [
      {
        ErrorCode: 1,
        ObjectId: 'objectId1',
        Attributes: this.objectAttributes[0],
        Properties: ['property1', 'property2'],
        FunctionProperties: ['functionProperties1', 'functionProperties2']
      },
      {
        ErrorCode: 2,
        ObjectId: 'objectId2',
        Attributes: this.objectAttributes[1],
        Properties: ['property3', 'property4'],
        FunctionProperties: ['functionProperties3', 'functionProperties4']
      }
    ];

  private readonly propertyInfoDetails: PropertyInfo<PropertyDetails>[] =
    [
      {
        ErrorCode: 0,
        ObjectId: 'objectId1',
        Attributes: this.objectAttributes[0],
        Properties: this.propertyDetails,
        FunctionProperties: this.propertyDetails
      },
      {
        ErrorCode: 0,
        ObjectId: 'objectId2',
        Attributes: this.objectAttributes[1],
        Properties: this.propertyDetails,
        FunctionProperties: this.propertyDetails
      },
      {
        ErrorCode: 0,
        ObjectId: 'objectId3',
        Attributes: this.objectAttributes[0],
        Properties: this.propertyDetails,
        FunctionProperties: this.propertyDetails
      },
      {
        ErrorCode: 0,
        ObjectId: 'objectId4',
        Attributes: this.objectAttributes[1],
        Properties: this.propertyDetails,
        FunctionProperties: this.propertyDetails
      }
    ];

  /* eslint-enable @typescript-eslint/naming-convention */

  private readonly propertyImage = '';

  public constructor(private readonly trace: MockTraceService) {
    super();
    this.trace.info(TraceModules.property, 'Property service created.');

  }

  public readPropertyNames(objectOrPropertyId: string): Observable<PropertyInfo<string>> {
    if (objectOrPropertyId == null) {
      return null!;
    }
    this.trace.debug(TraceModules.property, 'readPropertyNames() called; objectOrPropertyId: %s', objectOrPropertyId);
    return of(this.propertyInfoString[0]);
  }

  public readProperties(objectOrPropertyId: string, requestType: number, readAllProperties: boolean): Observable<PropertyInfo<PropertyDetails>[]> {
    if (objectOrPropertyId == null) {
      return null!;
    }
    if (readAllProperties) {
      this.trace.debug(TraceModules.property, 'readProperties(): readAllProperties = true');
    }
    return of(this.propertyInfoDetails);
  }

  public readPropertiesMulti(objectOrPropertyIds: string[], requestType: number, readAllProperties: boolean,
    booleansAsNumericText?: boolean): Observable<PropertyInfo<PropertyDetails>[]> {
    if ((objectOrPropertyIds == null) || (objectOrPropertyIds.length === 0)) {
      return null!;
    }
    if (readAllProperties) {
      this.trace.debug(TraceModules.property, 'readPropertiesMulti(): readAllProperties = true');
    }
    return of(this.propertyInfoDetails);
  }

  public readPropertiesAndValue(objectOrPropertyId: string, readAllProperties: boolean,
    booleansAsNumericText?: boolean): Observable<PropertyInfo<PropertyDetails>> {
    if (objectOrPropertyId == null) {
      return null!;
    }
    if (readAllProperties) {
      this.trace.debug(TraceModules.property, 'readPropertiesAndValue(): readAllProperties = true');
    }
    if (booleansAsNumericText && booleansAsNumericText === true) {
      this.trace.debug(TraceModules.property, 'booleansAsNumericText(): readAllProperties = true');
    }
    return of(this.propertyInfoDetails[0]);
  }

  public readPropertyImage(propertyId: string): Observable<string> {
    if (propertyId == null) {
      return null!;
    }
    return of(this.propertyImage);
  }

}
