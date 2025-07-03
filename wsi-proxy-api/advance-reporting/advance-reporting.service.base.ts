import { Observable } from 'rxjs';

import { CascadingOptions, ExecuteApiParams, ParameterDetails } from './data.model';
/**
 * Base class for the WSI trends service.
 * See the WSI documentation for details.
 */
export abstract class AdvanceReportingServiceBase {
  /**
   * This method will give us Paramter related metadata.
   */
  public abstract getParameterDetailsJson(systemId: number, fileName: string, selectedNode: string): Observable<ParameterDetails>;

  /**
   * This method will give us cascaded Paramter based option list.
   */
  public abstract getCascadingOptionListByParam(systemId: number, fileName: string,
    cascadingParamName: string, selectedOption: string): Observable<CascadingOptions>;

  /**
   * This method returns saves the pdf/excel or both file at execution of report
   */
  public abstract executeParameters(data: ExecuteApiParams): Observable<any>;

}
