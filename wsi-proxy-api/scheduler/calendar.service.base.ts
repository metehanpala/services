import { Observable } from 'rxjs';

/**
 * Base class for the calendar service.
 * See the WSI documentation for details.
 */
export abstract class CalendarServiceBase {

  /**
   * Gets the calendar based on the object Id from WSI.
   *
   * @abstract
   * @param {string } objectId
   * @returns {Observable<any>}
   */
  public abstract getCalendar(objectId: string): Observable<any>;

  /**
   * saves the calendar on WSI.
   *
   * @abstract
   * @param {string } objectId
   * @returns {Observable<any>}
   */
  public abstract saveCalendar(calendar: any): Observable<any>;
}
