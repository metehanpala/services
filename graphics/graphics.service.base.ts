import { HttpClient } from '@angular/common/http';
import { TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { BrowserObject } from '../wsi-proxy-api/system-browser/data.model';
import { GraphicInfo } from './data.model';

export abstract class GraphicsServiceBase {

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } httpClient The http service
   */
  public constructor(public traceService: TraceService, protected httpClient: HttpClient) {
  }

  /**
   * returns true if the object is graphical or it has a graphical item related to it, otherwise false
   *
   * @returns {boolean}
   *
   * @memberOf GraphicsServiceBase
   */
  public abstract hasGraphicalItems(objectId: string): Observable<boolean>;

  /**
   * Gets the graphics items based on provided DpId
   *
   * @returns {Observable<GraphicInfo[]>}
   *
   * @memberOf GraphicsServiceBase
   */
  public abstract getGraphicsItems(objectId: string): Observable<GraphicInfo[]>;

  /**
   * Gets the graphics content based on provided getGraphicsItems selection
   *
   * @returns {Observable<string>}
   *
   * @memberOf GraphicsServiceBase
   */
  public abstract getGraphicsContent(graphicId: string): Observable<string>;

  /**
   * Gets the first child of the designation which has graphics.
   *
   * @returns {Observable<BrowserObject>}
   *
   * @memberOf GraphicsServiceBase
   */
  public abstract getChildWithGraphics(designation: string): Observable<BrowserObject>;
}
