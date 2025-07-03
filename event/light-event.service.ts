import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { Observable, Observer, of } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { WSIEvent } from '../wsi-proxy-api/event/data.model';
import { EventProxyServiceBase } from '../wsi-proxy-api/event/event-proxy.service.base';
import { IconImage, Tables, TextEntry } from '../wsi-proxy-api/tables/data.model';
import { TablesServiceBase } from '../wsi-proxy-api/tables/tables.service.base';
import { CategoryService } from './category.service';
import { Category, Discipline, Event, SubDiscipline } from './data.model';

const imageHeader = '<img src="data:image/png;base64,';

@Injectable({
  providedIn: 'root'
})
export class LightEventService {

  private readonly categories: Category[] = [];
  private readonly disciplines: Discipline[] = [];

  public constructor(
    private readonly traceService: TraceService,
    private readonly categoryService: CategoryService,
    private readonly eventProxyService: EventProxyServiceBase,
    private readonly tablesService: TablesServiceBase) {

    this.traceService.info(TraceModules.lightEvents, 'LightEventService created.');
  }

  public getEvent(eventId: string): Observable<Event | null> {
    if (eventId != null) {
      this.traceService.info(TraceModules.lightEvents, 'getEvent(%s) called ', eventId);

      const messageObs: Observable<Event> = new Observable((observer: Observer<Event>) => {
        this.onSubscription(observer, eventId);
        return (): void => this.teardownLogic();
      });
      return messageObs;
    } else {
      return of(null);
    }
  }

  private setTargetEvent(events: any, eventId: string): WSIEvent {
    let targetEvent: WSIEvent = events.Events.find((e: any) => e.Id === eventId);
    if (targetEvent == null && eventId.endsWith('*')) {
      targetEvent = events.Events.find((e: any) => e.Id === eventId.substring(0, eventId.length - 1));
    }
    return targetEvent;
  }

  private setIconType(category: Category, discipline: Discipline, observer: Observer<Event>, targetEvent: WSIEvent,
    subDisciplineTextEntry: TextEntry, subDiscipline: SubDiscipline): void {
    // get subdiscpline icon
    this.tablesService.getGlobalIconExt(Tables.SubDisciplines, subDisciplineTextEntry.value).subscribe(
      (iconImage: IconImage) => {
        let imageStr: string | undefined;
        if (iconImage?.image !== undefined && iconImage.image !== '') {

          switch (iconImage.imageFormat) {
            case 'SVG':
              imageStr = iconImage.image;
              break;
            case 'PNG':
            default:
              imageStr = imageHeader + iconImage.image + '"/>';
              break;
          }
        }
        subDiscipline.icon = imageStr;

        const eventIcon: string | undefined = (imageStr != null && imageStr !== '') ? imageStr : discipline.icon;

        const event: Event = new Event();
        event.setInitialValuesFromWSIEvent(targetEvent, category, eventIcon);
        this.pushToClientAndDispose(observer, event);
      });
  }

  private setIcon(disciplineTextEntry: TextEntry): string | undefined {
    // get discipline icon
    this.tablesService.getGlobalIconExt(Tables.Disciplines, disciplineTextEntry.value).subscribe(
      (iconImage: IconImage) => {
        let imageStr: string | undefined;
        if (iconImage?.image !== undefined && iconImage.image !== '') {

          switch (iconImage.imageFormat) {
            case 'SVG':
              imageStr = iconImage.image;
              break;
            case 'PNG':
            default:
              imageStr = imageHeader + iconImage.image + '"/>';
              break;
          }
        }
        return imageStr;
      });
    return '';
  }

  private onSubscription(observer: Observer<Event>, eventId: string): void {
    this.eventProxyService.getEvents().subscribe((events: any) => {
      if (events?.Events) {
        this.traceService.info(TraceModules.lightEvents, 'getEvents returns a list of WSIEvent.');
        const targetEvent = this.setTargetEvent(events, eventId);
        if (targetEvent != null) {
          this.categoryService.getCategories().subscribe((categories: Category[]) => {
            if (categories != null) {
              const category: Category | null | undefined = categories.find(c => c.id === targetEvent.CategoryId);
              if (category != null && category != undefined) {
                // get disciplines
                this.tablesService.getGlobalText(Tables.Disciplines, true).subscribe((disciplineTexts: TextEntry[]) => {

                  // get discipline
                  const disciplineTextEntry: TextEntry | undefined | null = disciplineTexts.find(dt => dt.value === targetEvent.SrcDisciplineId);
                  if (disciplineTextEntry != null) {
                    const discipline: Discipline = new Discipline(disciplineTextEntry.value, disciplineTextEntry.text, '', []);
                    // get discipline icon
                    discipline.icon = this.setIcon(disciplineTextEntry);

                    // get subdiscipline
                    const subDisciplineTextEntry: TextEntry | undefined = disciplineTextEntry.subText?.find(dt => dt.value === targetEvent.SrcSubDisciplineId);

                    const subDiscipline: SubDiscipline = new SubDiscipline(subDisciplineTextEntry?.value, subDisciplineTextEntry?.text, '');
                    discipline.subDisciplines?.push(subDiscipline);

                    // get subdiscpline icon
                    this.setIconType(category, discipline, observer, targetEvent, subDisciplineTextEntry!, subDiscipline);
                  }
                });
              } else {
                this.pushToClientAndDispose(observer, null);
              }
            } else {
              this.pushToClientAndDispose(observer, null);
            }
          });
        } else {
          this.traceService.warn(TraceModules.lightEvents, 'getEvents targetEvent not found.');
          this.pushToClientAndDispose(observer, null);
        }
      } else {
        this.traceService.info(TraceModules.lightEvents, 'getEvents call returns no event.');
        this.pushToClientAndDispose(observer, null);
      }
    });
  }

  private getIcon(disciplineId: number, subDisciplineId: number): string | undefined | null {
    const foundDiscipline: Discipline | undefined = this.disciplines.find((discipline: Discipline) => discipline.id === disciplineId);
    if (foundDiscipline !== undefined) {
      const foundSubDiscipline: SubDiscipline | undefined = foundDiscipline.subDisciplines?.find((subDiscipline: SubDiscipline) =>
        subDiscipline.id === subDisciplineId);
      if (foundSubDiscipline?.icon !== undefined && foundSubDiscipline.icon !== '') {
        return foundSubDiscipline.icon;
      }
      return foundDiscipline.icon;
    }
    return null;
  }

  private pushToClientAndDispose(observer: Observer<Event>, result: Event | null): void {
    observer.next(result!);
    observer.complete();
  }

  private teardownLogic(): void {
    this.traceService.info(TraceModules.lightEvents, 'teardownLogic() called for EventListModeService.getMessageParameters');
    this.dispose();
  }

  private dispose(): void {
    //
  }

}
