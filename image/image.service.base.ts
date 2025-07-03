import { HttpClient } from '@angular/common/http';
import { TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

/**
 * Base class for the image service.
 */
export abstract class ImageBase {
  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {httpClient } httpClient The Angular 2 http service
   */
  public constructor(public traceService: TraceService, protected httpClient: HttpClient) {
  }

  /**
   * Returns the specified image.
   *
   * @abstract
   * @param {string } imageId
   * @param {string } libPath
   * @param {string } format
   * @param {number } width
   * @param {number } height
   * @param {boolean } enoceBase64
   * @returns {Observable<string>}
   *
   * @memberOf ImageBase
   */
  public abstract getImage(imageId: string, libPath: string, format: string, width: number, height: number, enoceBase64: boolean): Observable<string>;
}
