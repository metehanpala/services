import { Observable } from 'rxjs';

import { MultiMonitorConfigurationData, StationData, StationDataPerUser } from './data.model';
/**
 * Base class for the WSI multi monitor configuration service.
 * See the WSI documentation for details.
 */
export abstract class MultiMonitorConfigurationServiceBase {

  public abstract getMultiMonitorConfiguration(stationIdentifier: string): Observable<any>;

  public abstract getMultiMonitorConfigurationPerUser(stationIdentifier: string): Observable<any>;

  public abstract setMultiMonitorConfiguration(data: MultiMonitorConfigurationData, stationIdentifier: string): Observable<StationData>;

  public abstract setMultiMonitorConfigurationPerUser(data: MultiMonitorConfigurationData, stationIdentifier: string): Observable<StationDataPerUser>;

  public abstract deleteMultiMonitorConfiguration(stationIdentifier: string): Observable<StationData>;

  public abstract deleteMultiMonitorConfigurationPerUser(stationIdentifier: string): Observable<StationDataPerUser>;

}
