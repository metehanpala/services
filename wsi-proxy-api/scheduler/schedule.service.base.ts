import { Observable } from 'rxjs';

/**
 * Base class for the schedule service.
 * See the WSI documentation for details.
 */
export abstract class ScheduleServiceBase {

  /**
   * Gets the schedule based on the object Id from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string } objectId
   * @returns {Observable<any>}
   */
  public abstract getSchedules(objectId: string): Observable<any>;

  /**
   * Gets the calendar list based on object Id from WSI.
   *
   * @abstract
   * @param {string } objectId
   * @returns {Observable<any>}
   */
  public abstract getCalendarList(objectId: string): Observable<any>;

  /**
   * Gets the calendar exceptions based on object Ids from WSI.
   *
   * @abstract
   * @param {string[] } calendarObjectIds
   * @returns {Observable<any> }
   */
  public abstract getCalendarExceptions(calendarObjectIds: string[]): Observable<any>;

  /**
   * Saves the schedule object on WSI.
   *
   * @abstract
   * @param {any } schedule
   * @returns {Observable<any> }
   */
  public abstract saveSchedule(schedule: any): Observable<any>;

  /**
   * Saves exceptions to WSI.
   *
   * @abstract
   * @param {any } schedule
   * @returns {Observable<any> }
   */
  public abstract saveExceptions(schedule: any): Observable<any>;

  /**
   * Saves schedule options to WSI.
   *
   * @abstract
   * @param {any } schedule
   * @returns {Observable<any> }
   */
  public abstract saveScheduleOptions(schedule: any): Observable<any>;
}
