import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, Observer, Subscription } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { EventSoundWsi, ResoundCategory } from '../wsi-proxy-api/event/data.model';
import { EventSoundProxyServiceBase } from '../wsi-proxy-api/event/event-sound-proxy.service.base';
import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { ConnectionState, Link } from '../wsi-proxy-api/shared/data.model';
import { EventSound } from './data.model';
import { EventSoundServiceBase } from './event-sound.service.base';

/**
 * Event Sound service.
 * Provides the functionality to read and subscribe to sound for events.
 *
 * @export
 * @class EventSoundService
 * @extends {EventSoundServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventSoundService extends EventSoundServiceBase {

  public subscribedEventSound: BehaviorSubject<EventSound | undefined> | undefined = new BehaviorSubject<EventSound | undefined>(undefined);
  private readonly soundCache: Map<string, string>;
  private gotDisconnected = false;
  private isSubscribed = false;

  public constructor(
    private readonly trace: TraceService,
    private readonly filesService: FilesServiceBase,
    private readonly eventSoundProxy: EventSoundProxyServiceBase) {
    super();
    this.soundCache = new Map<string, string>();
    this.trace.info(TraceModules.eventsSound, 'EventSoundService created.');
    this.eventSoundProxy.eventSoundNotification().subscribe(eventSounds => this.onEventSoundsNotification(eventSounds));
    this.eventSoundProxy.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
  }

  public getCurrentSound(): Observable<EventSound> {
    this.trace.info(TraceModules.eventsSound, 'EventSoundService.getCurrentSound() called.');
    return this.eventSoundProxy.getCurrentSound().pipe(concatMap(eventSound => this.onEventSound(eventSound)));
  }

  public subscribeEventSound(disableCategories?: string[], resoundData?: ResoundCategory[]): Observable<boolean> {
    this.isSubscribed = true;
    this.trace.info(TraceModules.eventsSound, 'EventSoundService.subscribeEventSound() called.');
    return this.eventSoundProxy.subscribeEventSound(disableCategories, resoundData);
  }

  public unSubscribeEventSound(): Observable<boolean> {
    this.isSubscribed = false;
    this.trace.info(TraceModules.eventsSound, 'EventSoundService.unSubscribeEventSound() called.');
    return this.eventSoundProxy.unSubscribeEventSound();
  }

  public eventSoundNotification(): Observable<EventSound | any> {
    if (this.subscribedEventSound == undefined) {
      this.subscribedEventSound = new BehaviorSubject<EventSound | undefined>(undefined);
    }
    return this.subscribedEventSound.asObservable();
  }

  public resetResoundTimer(): Observable<boolean> {
    this.trace.info(TraceModules.eventsSound, 'EventSoundService.resetResoundTimer() called.');
    return this.eventSoundProxy.resetResoundTimer();
  }

  private onEventSound(eventSoundWsi: EventSoundWsi): Observable<EventSound> {
    this.trace.info(TraceModules.eventsSound, 'EventSoundService: Successful response for getCurrentSound()');
    return new Observable((observer: Observer<EventSound>) => {
      this.processSoundFile(eventSoundWsi, observer, true);
    });
  }

  private processSoundFile(eventSoundWsi: EventSoundWsi, observer: Observer<EventSound>, complete: boolean): void {
    this.trace.info(TraceModules.eventsSound, 'EventSoundService.processSoundFile(): called');

    if (observer === undefined) {
      return;
    }
    const eventSound: EventSound = new EventSound(eventSoundWsi);
    if (eventSound.links.length === 0) {
      // No sound to play
      this.trace.debug(TraceModules.eventsSound, 'EventSoundService.processSoundFile(): No sound to play');
      observer.next(eventSound);
      if (complete) {
        observer.complete();
      }
      return;
    }
    const link: Link = eventSound.links[0];
    const cache: Map<string, string> = this.soundCache;
    let soundFile: string | undefined = this.soundCache.get(link.Href);
    if (soundFile !== undefined) {
      this.trace.debug(TraceModules.eventsSound, 'EventSoundService.processSoundFile(): Sound file in cache!');
      eventSound.sound = soundFile;
      observer.next(eventSound);
      if (complete) {
        observer.complete();
      }
    } else {
      this.trace.debug(TraceModules.eventsSound, 'EventSoundService.processSoundFile(): Sound file not in cache, need to get it!');
      const subscription: Subscription = this.filesService.getFileFromLink(link)
        .subscribe((soundFileBlob: Blob) => {
          const reader: FileReader = new FileReader();
          reader.onloadend = (): void => {
            soundFile = reader.result?.toString().replace('data:;', 'data:audio\\wav;');
            // Add to cache
            cache.set(link.Href, soundFile!);
            eventSound.sound = soundFile;
            observer.next(eventSound);
            if (complete) {
              observer.complete();
            }
          };
          reader.readAsDataURL(soundFileBlob);
          subscription.unsubscribe();
        }, reason => {
          this.onGetSoundFileError(link, reason);
        });
    }
  }

  private onGetSoundFileError(link: Link, err: any): void {
    this.trace.error(TraceModules.eventsSound,
      'EventSoundService.onGetSoundFileError(): Failed to read sound file: href = %s, err = %s', link.Href, err);
  }

  private onEventSoundsNotification(eventSoundFromWSI: EventSoundWsi): void {
    if (this.trace.isDebugEnabled(TraceModules.eventSoundNotifications)) {
      this.trace.debug(TraceModules.eventSoundNotifications, 'EventSoundService.onEventSoundsNotification(): File=%s', eventSoundFromWSI.FileName);
    }
    this.processSoundFile(eventSoundFromWSI, this.subscribedEventSound!, false);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.trace.info(TraceModules.eventsSound, 'EventSoundService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
      if (this.subscribedEventSound !== undefined) {
        const observer: BehaviorSubject<EventSound | undefined> = this.subscribedEventSound;
        this.subscribedEventSound = undefined;
        observer.error({ message: 'disconnected' });
      }
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.trace.info(TraceModules.eventsSound,
        'EventSoundService.onNotifyConnectionState(): Connection reestablished');
      this.gotDisconnected = false;
      if (this.isSubscribed) {
        this.eventSoundProxy.subscribeEventSound();
      }
    }
  }
}
