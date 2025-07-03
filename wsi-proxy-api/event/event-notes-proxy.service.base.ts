import { Observable } from 'rxjs';

import { WsiEventNote } from './data.model';

/**
 * Base class for the event category sound service.
 * Provides the functionality to read and subscribe to sound for events.
 *
 * @export
 * @abstract
 * @class EventNotesProxyServiceBase
 */
export abstract class EventNotesProxyServiceBase {
  /**
   * Gets the EventNotes of the specified event via Web API.
   *
   * @abstract
   * @param {string} eventID
   * @returns {Observable<WsiEventNote>} An Observable returning a WsiEventNote.
   *
   * @memberOf EventNotesProxyServiceBase
   */
  public abstract getEventNotes(eventID: string): Observable<WsiEventNote>;

  /**
   * Puts the EventNotes for the specified event via Web API.
   *
   * @abstract
   * @param {string} eventID
   * @param {string} eventNotes
   * @returns {Observable<boolean> }
   *
   * @memberOf EventNotesProxyServiceBase
   */
  public abstract setEventNote(eventID: string, eventNote: string): void ;
}
