import { HttpErrorResponse, HttpParams, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ObjectAttributes, PropertyDetails, PropertyInfo, Value } from '../wsi-proxy-api/shared/data.model';
import { PropertyValuesService } from './property-values.service';

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

/* eslint-enable @typescript-eslint/naming-convention */

class RouterStub {}

// Tests  /////////////
describe('Property Value Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'productSettingFilePath', useValue: 'noMatter' },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        PropertyValuesService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create PropertyValues Service',
    inject([PropertyValuesService], (propertyValuesService: PropertyValuesService) => {
      expect(propertyValuesService instanceof PropertyValuesService).toBe(true);
    }
    ));

  it('should call method readPropertiesAndValue',
    inject([HttpTestingController, PropertyValuesService], (httpTestingController: HttpTestingController, propertyValuesService: PropertyValuesService) => {

      propertyValuesService.readPropertiesAndValue('objectOrPropertyId1', true)
        .subscribe(
          (data: PropertyInfo<PropertyDetails>) => expect(data).toEqual(propertyInfoDetails[0]),
          error => error as any);

      // workaround provided by https://github.com/angular/angular/issues/19974
      // since there is a open Issue related to httpClient with params
      let params: HttpParams = new HttpParams();
      params = params.set('readAllProperties', String(true));
      const reqParams: TestRequest = httpTestingController.expectOne(data => data.params.has('readAllProperties'));

      reqParams.flush(propertyInfoDetails[0]);
      httpTestingController.verify();

    }
    ));

  it('should call method readPropertiesAndValue and trow error',
    inject([HttpTestingController, PropertyValuesService], (httpTestingController: HttpTestingController, propertyValuesService: PropertyValuesService) => {

      propertyValuesService.readPropertiesAndValue(null!, true).pipe(
        tap((data: PropertyInfo<PropertyDetails>) => {
          fail('should not respond');
        }),
        catchError(err => {
          expect(err).toMatch(err);
          return of(null); // failure is the expected test result
        })).toPromise();
    }
    ));

  it('should call method readPropertiesAndValue and fails',
    inject([HttpTestingController, PropertyValuesService], (httpTestingController: HttpTestingController, propertyValuesService: PropertyValuesService) => {

      const msg = '404';
      propertyValuesService.readPropertiesAndValue('objectOrPropertyId1', true).subscribe(
        (data: PropertyInfo<PropertyDetails>) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      // imageService service should have made one request to GET getImage
      // workaround provided by https://github.com/angular/angular/issues/19974
      // since there is a open Issue related to httpClient with params
      let params: HttpParams = new HttpParams();
      params = params.set('readAllProperties', String(true));
      const reqParams: TestRequest = httpTestingController.expectOne(data => data.params.has('readAllProperties'));

      // respond with a 404 and the error message in the body
      reqParams.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

});
