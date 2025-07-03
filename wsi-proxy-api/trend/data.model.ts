import { ValidationInput } from '../shared/data.model';

/* eslint-disable @typescript-eslint/naming-convention */
export class TrendViewDefinitionBase {
  public TvdObjectId: string | undefined;
  public NumberDisplayedSamplesPerTrendSerie: number | undefined;
  public RemoveOnlineTrendLogOfDeletedTrendSerie: boolean | undefined;
  public TimeRange: TvdTimeRange | undefined;
  public TitleLeft: string | undefined;
  public TitleRight: string | undefined;
  public TitleTop: string | undefined;
  public TvCovType: string | undefined;
  public ShowQualityIndication?: boolean;
}

export class TrendViewDefinition extends TrendViewDefinitionBase {
  public AxisX: AxisDefinitionRepresentation | undefined;
  public AxisYLeft: AxisDefinitionRepresentation | undefined;
  public AxisYRight: AxisDefinitionRepresentation | undefined;
  public DescriptionTvd: string | undefined;
  public IdTvd: string | undefined;
  public NameTvd: string | undefined;
  public TsdCollectionInfo: TrendSeriesDefinitionCollection | undefined;
  public TvdType: number | undefined;
  public SubChartCollection: SubChartCollectionRepresentation | undefined;
}

export class TrendViewDefinitionUpdate extends TrendViewDefinitionBase {
  public AxisX: AxisDefinitionUpdateRepresentation | undefined;
  public AxisYLeft: AxisDefinitionUpdateRepresentation | undefined;
  public AxisYRight: AxisDefinitionUpdateRepresentation | undefined;
  public CNSNode: CNSNode | undefined;
  public Designation: string | undefined;
  public TsdCollectionInfo: TrendSeriesDefinitionUpdateCollection | undefined;
  public SubChartCollection: SubChartUpdateCollectionRepresentation | undefined;
  public ValidationInput: ValidationInput | undefined;
}

export class CNSNode {
  public Name: string | undefined;
  public Description: string | undefined;
}

export class TvdTimeRange {
  public AbsoluteTimeRange: any;
  public RelativeTimeRange: any;
  public ValidTimeRange: number | undefined;
  public IsFullRangeSaved: boolean | undefined;
}

export class EnumerationText {
  public Descriptor: string | undefined;
  public Value: number | undefined;
}

export class TrendSeriesDefinitionBase {
  public ArchiveOn: boolean | undefined;
  public AxisAttachment: string | undefined;
  public ChartLineStyle: string | undefined;
  public ChartLineType: string | undefined;
  public Color: string | undefined;
  public TrendLogObjectId: string | undefined;
  public TrendLogObjectIdInternal: string | undefined;
  public TrendLogOnlineObjectId: string | undefined;
  public TrendedObjectId: string | undefined;
  public IsLineVisible: boolean | undefined;
  public LineWidth: number | undefined;
  public ShowDataLabels: boolean | undefined;
  public ShowMarkers: boolean | undefined;
  public ShowQualityIcons: boolean | undefined;
  public MarkerType: string | undefined;
  public Type: string | undefined;
  public Smoothing: boolean | undefined;
  public CustomDescription: string | undefined;
  public isNonTrended: boolean | undefined;
}

export class TrendSeriesDefinition extends TrendSeriesDefinitionBase {
  public ReservedDateTime: string | undefined;
  public AccessDenied: boolean | undefined;
  public AccessDeniedOnline: boolean | undefined;
  public AccessDeniedOffline: boolean | undefined;
  public Alias: string | undefined;
  public DescriptionTlField: string | undefined;
  public DescriptionTlGms: string | undefined;
  public DescriptionTo: string | undefined;
  public DescriptionToProperty: string | undefined;
  public PropertyName: string | undefined;
  public TrendSeriesId: string | undefined;
  public IsDefaultProperty: boolean | undefined;
  public Index: number | undefined;
  public ManagedType: string | undefined;
  public MaxTimeStamp: string | undefined;
  public MinTimeStamp: string | undefined;
  public TimeZoneServer: string | undefined;
  public DataType: string | undefined;
  public UnitText: string | undefined;
  public ValueType: string | undefined;
  public Resolution: number | undefined;
  public EnumerationTexts: EnumerationText[] | undefined;
  public SubChartId: string | undefined;
}

export class TrendSeriesUpdateDefinition extends TrendSeriesDefinitionBase {
  public ObjectPropertyId: string | undefined;
  public SubChartId: string | undefined;
  public AccessDeniedOnline: boolean | undefined;
  public AccessDeniedOffline: boolean | undefined;
}

export class AxisDefinitionRepresentation {
  public AutoScale: boolean | undefined;
  public AxisType: number | undefined;
  public ScaleMax: number | undefined;
  public ScaleMin: number | undefined;
  public ShowTitle: boolean | undefined;
  public ShowZeroLine: boolean | undefined;
  public Title: string | undefined;
}

export class AxisDefinitionUpdateRepresentation {
  public AutoScale: boolean | undefined;
  public ScaleMax: number | undefined;
  public ScaleMin: number | undefined;
  public ShowTitle: boolean | undefined;
  public ShowZeroLine: boolean | undefined;
  public Title: string | undefined;
}

export class TrendSeriesDefinitionCollection {
  public TrendSeriesDefinitions: TrendSeriesDefinition[] | undefined;
}

export class TrendSeriesDefinitionUpdateCollection {
  public TrendSeriesDefinitions: TrendSeriesUpdateDefinition[] | undefined;
}

export class SubChartRepresentation {
  public SubChartId: string | undefined;
  public AxisYLeft: AxisDefinitionRepresentation | undefined;
  public AxisYRight: AxisDefinitionRepresentation | undefined;
}

export class SubChartUpdateRepresentation {
  public SubChartId: string | undefined;
  public AxisYLeft: AxisDefinitionUpdateRepresentation | undefined;
  public AxisYRight: AxisDefinitionUpdateRepresentation | undefined;
}

export class SubChartCollectionRepresentation {
  public SubCharts: SubChartRepresentation[] | undefined;
}

export class SubChartUpdateCollectionRepresentation {
  public SubCharts: SubChartUpdateRepresentation[] | undefined;
}

export enum ChartLineStyle {
  Full = 0,
  Dotted = 1,
  Dashed = 2,
  DotDashed = 3
}

export enum ChartLineType {
  Line = 0,
  StepLine = 1,
  Dots = 2
}

export enum AxisAttachment {
  ToLeft = 0,
  ToRight = 1
}

export enum Type {
  Offline = 0,
  Online = 1,
  Normalized = 2,
  Predicted = 3
}

/* eslint-disable id-blacklist */
export enum ValueType {
  Boolean = 0,
  uInt = 1,
  sInt = 2,
  Float = 3,
  Enum = 4,
  Bitset = 5,
  Null = 32,
  Failure = 33,
  TimeChange = 34
}
/* eslint-enable id-blacklist */

export enum TvCovType {
  Auto = 0,
  Manual = 1
}

export enum RelativeTime {
  year = 0,
  month = 1,
  week = 2,
  day = 3,
  hour = 4,
  minute = 5,
  all = 6
}

export enum MarkerType {
  Square = 0,
  Diamond = 1,
  Triangle = 2,
  LeftTriangle = 3,
  RightTriangle = 4,
  InvertedTriangle = 5,
  Circle = 6,
  Cross1 = 7,
  Cross2 = 8
}

export class TrendDataResult {
  public Id: string | undefined;
  public SeriesPropertyId: string | undefined;
  public Series: TrendQualityValue[] | undefined;
}

export class TrendQualityValue {
  public Value: string | undefined;
  public Quality: string | undefined;
  public QualityGood: string | undefined;
  public Timestamp: string | undefined;
}

export class TrendAggregatedDataResult {
  public Id: string | undefined;
  public SeriesPropertyId: string | undefined;
  public Series: AggregatedSeriesResult[] | undefined;
}
export interface AggregatedSeriesResult {
  AvgX: number;
  AvgY: number;
  Count: number;
  FromValueDescriptor: string;
  FromValue: number;
  FromTime: string; // ISO 8601 date string
  Min: number;
  Max: number;
  StDevX: number;
  StDevY: number;
  SumX: number;
  SumY: number;
  SumXX: number;
  SumXY: number;
  SumYY: number;
  ToTime: string; // ISO 8601 date string
  ToValueDescriptor: string;
  ToValue: number;
  VarX: number;
  VarY: number;
}

export class TrendSeriesInfo {
  public ObjectId: string | undefined;
  public PropertyIndex: string | undefined;
  public PropertyName: string | undefined;
  public CollectorObjectOrPropertyId: string | undefined;
  public TrendseriesId: string | undefined;
  public TrendedPropertyIdentifier: string | undefined;
  public TrendType: string | undefined;
}

export class BorderTimeRange {
  public From: string | undefined;
  public To: string | undefined;
}

/* eslint-disable @typescript-eslint/naming-convention */

export class GeneralSetings {
  public pixelsPerSample: number | undefined;
  public timeRange: TimeRange | undefined;
  public displayQuality: boolean | undefined;
}

export class TimeRange {
  public timeRangeValue: number | undefined;
  public timeRangeUnit: string | undefined;
}
