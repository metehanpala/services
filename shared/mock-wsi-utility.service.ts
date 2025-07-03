import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  ErrorDisplayItem, ErrorDisplayMode, ErrorDisplayState, ErrorNotificationServiceBase, isNullOrUndefined,
  TraceService
} from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';

import {
  WsiError, WsiErrorCmdExecFailed, WsiErrorConnectionFailed,
  WsiErrorEvtCmdExecFailed, WsiErrorGrantFailed, WsiErrorLicenseInvalid
} from '../wsi-proxy-api/shared/wsi-error';
import { TraceModules } from './trace-modules';

/**
 * GMS WSI utility service. Provides som helper functions related to the WSI.
 */
@Injectable({
  providedIn: 'root'
})
export class MockWsiUtilityService {

  private readonly _licenseErrorItem: ErrorDisplayItem;

  /**
   * Constructor
   * @param {TraceService } trace The trace service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   */
  public constructor(protected traceService: TraceService,
    private readonly router: Router, private readonly ngZone: NgZone) {
    this._licenseErrorItem = new ErrorDisplayItem(ErrorDisplayMode.Toast, ErrorDisplayState.Inactive);
    this._licenseErrorItem.setDisplayMessageKey('GMS_SERVICES.LICENSE_ERROR_MSG');
    this._licenseErrorItem.setDisplayTitleKey('GMS_SERVICES.LICENSE_ERROR_TITLE');
    this.traceService.info(TraceModules.utilities, 'WSI Utility service created.');
  }

  /**
   * Extracts the body data from an HTTP response if the response status is successful (2xx).
   * Logs the response body for debugging if debug tracing is enabled for the given module.
   * Throws an error if the HTTP status indicates a failure.
   *
   * @param {HttpResponse<any>} res - The full HTTP response object to extract data from.
   * @param {string} traceModule - The module name used for tracing/logging purposes.
   * @param {string} method - The method name or context where this extraction occurs.
   *
   * @throws {Error} Throws an error if the response status is not in the 2xx range.
   *
   * @returns {any} Returns the parsed response body if available and successful.
   *                If an exception occurs during parsing or logging, logs a warning and returns undefined.
   */
  public extractData(res: HttpResponse<any>, traceModule: string, method: string): any {
    // Check for successful HTTP status codes (200-299)
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    } else {
      try {
        const body: any = res.body;

        // If debug tracing is enabled for the module, log the response body in detail
        if (this.traceService.isDebugEnabled(traceModule)) {
          if (Array.isArray(body) === true) {
            // If the body is an array, concatenate each item's JSON string representation for logging
            let traceStr = '';
            (body as any[]).forEach(item => {
              traceStr = traceStr + '\n\n' + JSON.stringify(item);
            });
            this.traceService.debug(traceModule, method, 'returned:', traceStr);
          } else {
            // If the body is a single object or primitive, log it directly
            this.traceService.debug(traceModule, method, 'returned:\n', JSON.stringify(body));
          }
        }

        // Return the extracted body data
        return body;

      } catch (exc) {
        // Log a warning if an exception occurs during processing the response
        this.traceService.warn(
          traceModule,
          method,
          'Response not handled properly; exception caught: ',
          res.url,
          '; url=',
          (exc as Error).message.toString()
        );
        // Note: no explicit return means undefined will be returned in case of exceptions
      }
    }
  }

  /**
  * Handles HTTP errors from backend responses and converts them into WsiError instances.
  *
  * Analyzes the given error response, categorizes it by HTTP status codes,
  * and creates specific WsiError subclasses depending on the error details.
  * It also logs the error details through trace services and optionally redirects
  * to a login page if authentication fails.
  *
  * @param {HttpResponse<any> | any} error - The error response or object caught from HTTP request.
  *                                           Can be an HttpErrorResponse or any other error type.
  * @param {string} traceModule - The module name used for tracing/logging purposes.
  * @param {string} method - The method name or context where the error occurred.
  * @param {ErrorNotificationServiceBase} [errorService] - Optional service for notifying errors to the user interface.
  * @param {boolean} [redirectonFailedAuth=true] - Optional flag to redirect to login page on 401 Unauthorized errors.
  *
  * @returns {Observable<any>} - Returns an Observable that emits a specific WsiError instance
  *                              wrapped in an error Observable, suitable for use in RxJS error handling.
  *                              If an unexpected error occurs during processing, returns a generic WsiError.
  */
  public handleError(
    error: HttpResponse<any> | any,
    traceModule: string,
    method: string,
    errorService?: ErrorNotificationServiceBase,
    redirectonFailedAuth = true
  ): Observable<any> {
    try {
      let wsiError: WsiError;

      // Check if the error is an HttpErrorResponse (Angular's HTTP error wrapper)
      if (error instanceof HttpErrorResponse) {
        const status = error.status;
        const statusText = error.statusText;
        const bodyError = error.error;

        // Determine if the error body matches the expected WSI error object shape
        const isErrorObject =
          bodyError &&
          typeof bodyError === 'object' &&
          'Id' in bodyError &&
          'Details' in bodyError &&
          'Error' in bodyError;

        // Handle specific known error codes and create corresponding WsiError instances
        if (status === 400 && isErrorObject) {
          const id = (bodyError as any).Id;
          const details = (bodyError as any).Details;
          const errMsg = (bodyError as any).Error;

          switch (id) {
            case 2400100:
              this.notifyLicenceErrorActive(errorService);
              wsiError = new WsiErrorLicenseInvalid(details, status, statusText);
              this.notifyLicenceErrorInactive(errorService);
              break;
            case 2400000:
              wsiError = new WsiErrorGrantFailed(details, status, statusText);
              break;
            case 2400398:
              wsiError = new WsiErrorCmdExecFailed(details, status, statusText);
              break;
            case 2400798:
              wsiError = new WsiErrorEvtCmdExecFailed(details, status, statusText);
              break;
            default:
              wsiError = new WsiError(details, status, statusText);
          }

          // Log the detailed error message for tracing
          this.traceReplyError(traceModule, method,
            this.wsiErrorMessage1(errMsg, id, details, status, statusText));

          // Handle authentication failures (Unauthorized)
        } else if (status === 401) {
          wsiError = new WsiError('Authentication failed. The user token is invalid.', status, statusText);

          // Optionally redirect the user to the login page on auth failure
          if (redirectonFailedAuth) {
            this.router.navigate(['/loginpage']);
          }
          this.traceReplyError(traceModule, method, this.wsiErrorMessage2(status, statusText));

          // Handle Forbidden errors (Access denied)
        } else if (status === 403) {
          const details = bodyError?.Details ?? '';
          wsiError = new WsiErrorGrantFailed(details, status, statusText);
          this.traceReplyError(traceModule, method, this.wsiErrorMessage2(status, statusText));

          // Handle connection failures or server errors (status 0 or 5xx)
        } else if (status === 0 || status >= 500) {
          wsiError = new WsiErrorConnectionFailed(
            'No connection to the building management system.',
            status,
            statusText
          );
          this.traceReplyError(traceModule, method, this.wsiErrorMessage2(status, statusText));

          // Handle all other errors with a generic error message
        } else {
          const message = bodyError?.message ?? error.message ?? 'Unknown error';
          wsiError = new WsiError(message, status, statusText);
          this.traceReplyError(traceModule, method, this.wsiErrorMessage2(status, statusText));
        }

        // Return an Observable that emits the constructed WsiError
        return observableThrowError(() => wsiError);

        // If error is not HttpErrorResponse, handle as a generic error
      } else {
        const errMsg: string = error?.message ?? error?.toString?.() ?? 'Unknown error';
        this.traceReplyError(traceModule, method, errMsg);
        return observableThrowError(() => new Error(errMsg));
      }

      // Catch any exceptions thrown while processing the error and log them
    } catch (exc) {
      const wsiError: WsiError = new WsiError('WSI reply error! See trace.');
      this.traceService.error(
        traceModule,
        method,
        ' exception caught: ',
        (exc as Error).message.toString()
      );
      return observableThrowError(() => wsiError);
    }
  }

  /**
  * Creates default HTTP headers for GET requests.
  * Sets 'Accept' header to 'application/json'.
  * Optionally adds 'Authorization' header if an auth token is provided.
  *
  * @param {string} [authToken] - Optional authentication token for Bearer authorization.
  * @returns {HttpHeaders} The configured HTTP headers for GET requests.
  */
  public httpGetDefaultHeader(authToken?: string): HttpHeaders {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Accept', 'application/json ');
    if (authToken !== undefined) {
      headers = headers.append('Authorization', 'Bearer ' + authToken);
    }
    return headers;
  }

  /**
   * Creates default HTTP headers for POST requests.
   * Extends GET headers by adding 'Content-Type' header as 'application/json; charset=utf-8'.
   * Optionally adds 'Authorization' header if an auth token is provided.
   *
   * @param {string} [authToken] - Optional authentication token for Bearer authorization.
   * @returns {HttpHeaders} The configured HTTP headers for POST requests.
   */
  public httpPostDefaultHeader(authToken?: string): HttpHeaders {
    let headers: HttpHeaders = this.httpGetDefaultHeader(authToken);
    headers = headers.append('Content-Type', 'application/json; charset=utf-8');
    return headers;
  }

  /**
   * Creates default HTTP headers for PUT requests.
   * Uses the same headers configuration as POST requests.
   *
   * @param {string} [authToken] - Optional authentication token for Bearer authorization.
   * @returns {HttpHeaders} The configured HTTP headers for PUT requests.
   */
  public httpPutDefaultHeader(authToken?: string): HttpHeaders {
    return this.httpPostDefaultHeader(authToken);
  }

  /**
   * Creates default HTTP headers for DELETE requests.
   * Uses the same headers configuration as GET requests.
   *
   * @param {string} [authToken] - Optional authentication token for Bearer authorization.
   * @returns {HttpHeaders} The configured HTTP headers for DELETE requests.
   */
  public httpDeleteDefaultHeader(authToken?: string): HttpHeaders {
    return this.httpGetDefaultHeader(authToken);
  }

  /**
   * Activates license error notification by setting the license error state to Active.
   * If an error service is provided, notifies it about the error state change.
   *
   * @param {ErrorNotificationServiceBase | undefined} errorService - Optional error notification service to notify about the license error.
   */
  private notifyLicenceErrorActive(errorService: ErrorNotificationServiceBase | undefined): void {
    // A needed license is missing or expired
    this._licenseErrorItem.state = ErrorDisplayState.Active;
    if (!isNullOrUndefined(errorService)) {
      errorService!.notifyErrorChange(this._licenseErrorItem);
    }
  }

  /**
   * Deactivates license error notification by setting the license error state to Inactive.
   * If an error service is provided, notifies it about the error state change.
   *
   * @param {ErrorNotificationServiceBase | undefined} errorService - Optional error notification service to notify about the license error reset.
   */
  private notifyLicenceErrorInactive(errorService: ErrorNotificationServiceBase | undefined): void {
    // This error is "reset" automatically
    this._licenseErrorItem.state = ErrorDisplayState.Inactive;
    if (!isNullOrUndefined(errorService)) {
      errorService!.notifyErrorChange(this._licenseErrorItem);
    }
  }

  /**
   * Logs an error message related to HTTP replies to the trace service.
   *
   * @param {string} traceModule - The module name for trace logging context.
   * @param {string} method - The method name or context where the error occurred.
   * @param {string} message - The error message to log.
   */
  private traceReplyError(traceModule: string, method: string, message: string): void {
    this.traceService.error(traceModule, method, ' http reply error: ', message);
  }

  /**
   * Constructs a detailed error message string with WSI error information and HTTP status.
   *
   * @param {string} error - The error message string.
   * @param {number} id - The specific WSI error identifier.
   * @param {string} details - Additional details about the error.
   * @param {number} status - The HTTP response status code.
   * @param {string} statusText - The HTTP response status text.
   *
   * @returns {string} The formatted error message string containing all WSI error info and HTTP status.
   */
  private wsiErrorMessage1(error: string, id: number, details: string, status: number, statusText: string): string {
    return `wsiError: ${error}; wsiErrorId: ${id}; wsiErrorDetails: ${details}; status: ${status}; statusText: ${statusText}`;
  }

  /**
   * Constructs a simplified error message string with HTTP status information.
   *
   * @param {number} status - The HTTP response status code.
   * @param {string} statusText - The HTTP response status text.
   *
   * @returns {string} The formatted status message string.
   */
  private wsiErrorMessage2(status: number, statusText: string): string {
    return `status: ${status}; statusText: ${statusText}`;
  }

}
