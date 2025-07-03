import { Observable } from 'rxjs';

import { ValidationInput } from '../wsi-proxy-api/shared/data.model';
import { Category, Discipline, Event, EventFilter, EventSubscription, SubDiscipline } from './data.model';

/**
 * Base class for the event service.
 * Provides the functionality to read events from WSI.
 *
 * @export
 * @abstract
 * @class EventBase
 */
export abstract class EventBase {

  /**
   * Creates a new Event Subscription associated with the optional specified Event filter and returns it.
   * In case the Filter is not specified, the default Subcription is created (the first time) or its
   * reference counter is incremented
   *
   * @abstract
   * @returns { EventSubscription> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract createEventSubscription(eventFilter?: EventFilter): EventSubscription;

  /**
   * Destroy the event Subscription specified by the optional Id.
   * In case the Id is not specified, the default Subcription its reference counter
   * is decremented or destoyed
   *
   * @abstract
   * @returns { void> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract destroyEventSubscription(id?: number): void;

  /**
   * set Filter for the event subscription specified by id, in case id is unspecified, targets the default subscription
   *
   * @abstract
   * @returns { void> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract setEventsFilter(eventFilter: EventFilter, id?: number): void;

  /**
   * Realign Events for filtered event notifications.
   *
   * @abstract
   * @returns { Observable<EventList> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract realignEventsWithFilter(id?: number): void;

  /**
   * Unsubscribe to event notifications.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract unSubscribeEvents(): Observable<boolean>;

  /**
   * send the specified command for the specified event
   *
   * @abstract
   * @returns { void> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract eventCommandById(eventToCommand: string, commandId: string, treatmentType?: string, validationInput?: ValidationInput): void;

  /**
   * send the specified command for the specified event
   *
   * @abstract
   * @returns { void> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract eventCommand(eventsToCommand: Event[], commandId: string, treatmentType?: string, validationInput?: ValidationInput): Observable<any>;

  /**
   * Get Disciplines (with id, description and icon).
   *
   * @abstract
   * @returns { Discipline[] }
   *
   * @memberOf Event.Service.Base
   */
  public abstract getDisciplines(): Discipline[];

  /**
   * Get all Categories available (with id, description and color).
   *
   * @abstract
   * @returns { Category[] }
   *
   * @memberOf Event.Service.Base
   */
  public abstract getCategories(): Category[];

  /**
   * Get a specific Category.
   *
   * @abstract
   * @returns { Category }
   *
   * @memberOf Event.Service.Base
   */
  public abstract getCategory(categoryId: number): Category;

  /**
   * Get a specific Disicipline
   *
   * @abstract
   * @returns { Discipline }
   *
   * @memberOf Event.Service.Base
   */
  public abstract getDiscipline(disciplineId: number): Discipline;

  /**
   * Get a specific SubDiscipline.
   *
   * @abstract
   * @returns { SubDiscipline }
   *
   * @memberOf Event.Service.Base
   */
  public abstract getSubDiscipline(disciplineId: number, subDisciplineId: number): SubDiscipline;

  /**
   * Get an event blinker.
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract getBlinker(): Observable<boolean>;

  /**
   * Get the time offset between server and client in milliseconds.
   *
   * @abstract
   * @returns { Promise<number> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract serverClientTimeDiff(): Promise<number>;

  /**
   * Get the AssistedTreatmentMode as Observable
   *
   * @abstract
   * @returns { Observable<boolean> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract get assistedTreatmentMode(): Observable<boolean>;

  /**
   * Get the AssistedTreatmentMode
   *
   * @abstract
   * @returns { boolean }
   *
   * @memberOf Event.Service.Base
   */
  public abstract getAssistedTreatmentMode(): boolean;

  /**
   * Set the AssistedTreatmentMode
   *
   * @abstract
   * @returns { void> }
   *
   * @memberOf Event.Service.Base
   */
  public abstract setAssistedTreatmentMode(value: boolean): void;
}
