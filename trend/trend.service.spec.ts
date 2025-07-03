import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase,
  MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { TrendDataResult, TrendQualityValue, TrendSeriesDefinition, TrendSeriesDefinitionCollection, TrendViewDefinition } from '../wsi-proxy-api';
import { AxisDefinitionRepresentation, MarkerType, SubChartCollectionRepresentation, SubChartRepresentation } from '../wsi-proxy-api/trend/data.model';
import { TrendService } from './trend.service';

/* eslint-disable @typescript-eslint/naming-convention */

const tsds: TrendSeriesDefinition[] = [
  {
    ReservedDateTime: '',
    AccessDenied: true,
    AccessDeniedOffline: false,
    AccessDeniedOnline: false,
    Alias: 'alias',
    ArchiveOn: true,
    AxisAttachment: 'left',
    ChartLineStyle: 'solid',
    ChartLineType: 'step',
    Color: '#FF0022FF',
    DescriptionTlField: 'tl',
    DescriptionTlGms: 'onlinetl',
    DescriptionTo: 'trendedObj',
    DescriptionToProperty: 'PropertyDesc',
    TrendLogObjectId: 'tldp',
    TrendLogObjectIdInternal: null!,
    TrendLogOnlineObjectId: 'tloDp',
    TrendedObjectId: 'ToDp',
    TrendSeriesId: 'TrendSeriesId',
    PropertyName: 'Property_Name',
    IsDefaultProperty: true,
    Index: 1,
    IsLineVisible: true,
    LineWidth: 3,
    ManagedType: 'TlOnline',
    MaxTimeStamp: '',
    MinTimeStamp: '',
    ShowDataLabels: true,
    ShowMarkers: true,
    ShowQualityIcons: true,
    TimeZoneServer: '',
    Type: 'Online',
    UnitText: 'F',
    ValueType: 'int',
    DataType: 'enum',
    MarkerType: MarkerType[MarkerType.Circle],
    Smoothing: false,
    CustomDescription: 'Custom Description',
    Resolution: 0,
    EnumerationTexts: [{
      Value: 0,
      Descriptor: 'State_1'
    }, {
      Value: 1,
      Descriptor: 'State_2'
    }],
    SubChartId: 'Subchart0',
    isNonTrended: false
  },
  {
    ReservedDateTime: '',
    AccessDenied: true,
    AccessDeniedOnline: false,
    AccessDeniedOffline: false,
    Alias: 'alias',
    ArchiveOn: true,
    AxisAttachment: 'left',
    ChartLineStyle: 'solid',
    ChartLineType: 'step',
    Color: '#FF0022FF',
    DescriptionTlField: 'tl',
    DescriptionTlGms: 'onlinetl',
    DescriptionTo: 'trendedObj',
    DescriptionToProperty: 'PropertyDesc',
    TrendLogObjectId: 'tldp',
    TrendLogObjectIdInternal: null!,
    TrendLogOnlineObjectId: 'tloDp',
    TrendedObjectId: 'ToDp',
    PropertyName: 'Property_Name',
    TrendSeriesId: 'TrendSeriesId',
    IsDefaultProperty: true,
    Index: 1,
    IsLineVisible: true,
    LineWidth: 3,
    ManagedType: 'TlOnline',
    MaxTimeStamp: '',
    MinTimeStamp: '',
    ShowDataLabels: true,
    ShowMarkers: true,
    ShowQualityIcons: true,
    TimeZoneServer: '',
    Type: 'Online',
    UnitText: 'F',
    ValueType: 'int',
    DataType: 'enum',
    MarkerType: MarkerType[MarkerType.Square],
    Smoothing: false,
    CustomDescription: 'Custom Description',
    Resolution: 0,
    EnumerationTexts: [{
      Value: 0,
      Descriptor: 'State_1'
    }, {
      Value: 1,
      Descriptor: 'State_2'
    }],
    SubChartId: 'SubChart0',
    isNonTrended: false
  }
];

const tsdCollection: TrendSeriesDefinitionCollection = {
  TrendSeriesDefinitions: tsds
};

const axisDefinitionRepresentation: AxisDefinitionRepresentation = {
  AutoScale: true,
  AxisType: 1,
  ScaleMax: 233,
  ScaleMin: 11,
  ShowTitle: true,
  ShowZeroLine: true,
  Title: ''
};
const subChartCollectionRepresentation: SubChartCollectionRepresentation | any = {
  SubCharts: SubChartRepresentation
};

const subChartRepresentation: SubChartRepresentation = {
  SubChartId: 'Subchart0',
  AxisYLeft: axisDefinitionRepresentation,
  AxisYRight: axisDefinitionRepresentation
};

const tvd: TrendViewDefinition = {
  AxisX: axisDefinitionRepresentation,
  AxisYLeft: axisDefinitionRepresentation,
  AxisYRight: axisDefinitionRepresentation,
  DescriptionTvd: 'DescTvd',
  TvdObjectId: 'ObjIdTvd',
  IdTvd: 'IdTvd',
  NameTvd: 'Name',
  NumberDisplayedSamplesPerTrendSerie: 1111,
  RemoveOnlineTrendLogOfDeletedTrendSerie: true,
  TimeRange: null!,
  TitleLeft: 'left',
  TitleRight: 'Right',
  TitleTop: 'top',
  TsdCollectionInfo: tsdCollection,
  TvdType: 1,
  TvCovType: 'Manual',
  SubChartCollection: subChartCollectionRepresentation!
};

const trendQualityValues: TrendQualityValue[] = [{
  Value: 'Value',
  Quality: 'Quality',
  QualityGood: 'QualityGood',
  Timestamp: 'Timestamp'
},
{
  Value: 'Value',
  Quality: 'Quality',
  QualityGood: 'QualityGood',
  Timestamp: 'Timestamp'
}];

const trendDataResult: TrendDataResult = {
  Id: 'Id',
  SeriesPropertyId: 'SeriesPropertyId',
  Series: trendQualityValues
};

/* eslint-enable @typescript-eslint/naming-convention */

class RouterStub {}
// Tests  /////////////

describe('TrendService', () => {
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
        TrendService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('can load instance', inject([HttpTestingController, TrendService], (trendService: TrendService) => {
    expect(trendService).toBeTruthy();
  }));

  it('can retrieve trend view definition object',
    inject([HttpTestingController, TrendService], (httpTestingController: HttpTestingController, trendService: TrendService) => {

      trendService.getTrendViewDefinition('ObjectId')
        .subscribe(
          (data: TrendViewDefinition) => expect(data).toBe(tvd),
          (error: any) => error);

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/trendseriesinfo/tvd/ObjectId');

      req.flush(tvd);
      httpTestingController.verify();

    })
  );

  it('can retrieve trend data',
    inject([HttpTestingController, TrendService], (httpTestingController: HttpTestingController, trendService: TrendService) => {
      trendService.getTrendData('trendSeriesId', 'fromDate', 'toDate', 'interval')
        .subscribe(
          (data: TrendDataResult) => expect(data).toBe(trendDataResult),
          error => error as any);

      const req: TestRequest = httpTestingController.expectOne(
        'protocol://site:port/host/api/trendseries/trendSeriesId?from=fromDate&to=toDate&intervals=interval');

      req.flush(trendDataResult);
      httpTestingController.verify();
    }));

});
