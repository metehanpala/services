import { Injectable } from '@angular/core';
import { Action,
  CustomSetting,
  NotifConfiguration,
  Notification,
  NotificationServiceBase,
  SettingsServiceBase,
  TraceService } from '@gms-flex/services-common';
import { Observable, Subject } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends NotificationServiceBase {

  public closeRightPanel: Subject<boolean> = new Subject<boolean>();

  private readonly _notifications: Map<string, Map<number, Notification>> = new Map<string, Map<number, Notification>>();
  private readonly _notificationsObservable: Subject<Notification | undefined> = new Subject<Notification | undefined>();
  private _parsed: Map<string, NotifConfiguration> | undefined;
  private _configurations: Map<string, NotifConfiguration> = new Map<string, NotifConfiguration>();
  private readonly _configurationsObservable: Subject<Map<string, NotifConfiguration>> = new Subject<Map<string, NotifConfiguration>>();
  private readonly _notificationQueue: Map<string, Notification[]> = new Map<string, Notification[]>();

  public constructor(
    private readonly traceService: TraceService,
    private readonly settingsService: SettingsServiceBase
  ) {
    super();
    this.traceService.info(TraceModules.notification, 'Service created.');
  }

  public register(sender: string, configuration: NotifConfiguration): void {
    this.settingsService.getSettings('notifconfig').subscribe(res => {
      if (res) {
        this._parsed = new Map(JSON.parse(res.replace(/'/g, '"')));
        this._parsed.forEach((value: NotifConfiguration, key: string) => {
          const config: NotifConfiguration = new NotifConfiguration('');
          this._parsed?.set(key, Object.assign(config, value));
        });
      }

      // map notification with sender and set configuration if not present in settings
      this._notifications.set(sender, new Map<number, Notification>());

      if (
        !this._parsed ||
        (this._parsed && !this._parsed.get(sender)) ||
        !this.equalToSaved(this._parsed.get(sender)!, configuration)
      ) {
        this._configurations.set(sender, configuration);
      } else {
        this._configurations.set(sender, this._parsed.get(sender)!);
      }

      this._configurationsObservable.next(this._configurations);

      this.traceService.info(TraceModules.notification, 'Registered new sender: ' + sender);

      this._notificationQueue.forEach((value: Notification[], key: string) => {
        if (key === sender) {
          value.forEach(val => {
            this.notify(key, val);
          });
          this._notificationQueue.delete(key);
        }
      });
    });
  }

  public notify(sender: string, notification: Notification): void {
    if (!this._notifications.has(sender)) {
      if (!this._notificationQueue.has(sender)) {
        this._notificationQueue.set(sender, []);
      }
      this._notificationQueue.get(sender)?.push(notification);
      this.traceService.info(TraceModules.notification, 'No sender with name \'' + sender + '\' registered.');
    } else {
      notification.setSender(sender);
      this._notifications.get(sender)?.set(notification.id, notification);
      this._notificationsObservable.next(notification);
    }
  }

  public getConfigurations(): Map<string, NotifConfiguration> {
    return this._configurations;
  }

  public subscribeConfigurations(): Observable<Map<string, NotifConfiguration>> {
    return this._configurationsObservable.asObservable();
  }

  public updateConfigurations(configurations: Map<string, NotifConfiguration>): void {
    this._configurations = configurations;
    this._configurationsObservable.next(configurations);

    // save configurations to settings service
    const valueString: string = JSON.stringify(Array.from(this._configurations.entries())).replace(/"/g, '\'');
    this.settingsService.putSettings('notifconfig', valueString).subscribe(res => {
      if (res === true) {
        this.traceService.info(TraceModules.notification, 'Config saved.');
      } else { this.traceService.error(TraceModules.notification, 'ERROR: Config not saved.'); }
    });
  }

  public getActiveNotifications(sender: string): Notification[] | any {
    if (this._notifications.has(sender)) {
      this.traceService.info(TraceModules.notification, 'Getting active notifications from sender ' + sender);
      return Array.from(this._notifications.get(sender)!.values());
    }
  }

  public subscribeNotifications(): Observable<Notification | any> {
    this.traceService.info(TraceModules.notification, 'Subscribing to notifications...');
    return this._notificationsObservable.asObservable();
  }

  public cancel(sender: string, notificationId: number): void {
    if (this._notifications.has(sender)) {
      if (this._notifications.get(sender)?.has(notificationId)) {
        this._notifications.get(sender)?.get(notificationId)?.cancel();
        this._notificationsObservable.next(this._notifications?.get(sender)?.get(notificationId));

        this._notifications.get(sender)?.delete(notificationId);

        this.traceService.info(TraceModules.notification, 'Request to cancel notification with sender=' + sender + ' and id=' + notificationId);
      }
    }
  }

  public cancelAll(sender: string): void {
    if (this._notifications.has(sender)) {
      this._notifications.get(sender)?.forEach(n => {
        n.cancel();
        this._notificationsObservable.next(n);
      });

      this._notifications.set(sender, new Map<number, Notification>());

      this.traceService.info(TraceModules.notification, 'Request to cancel all notifications from sender ' + sender);
    }
  }

  public performAction(notification: Notification, action: Action): void {
    const callback: any = action.getCallback();
    const result = callback(notification, action);

    if (result === true) {
      this.closeRightPanel.next(true);
    }

    // cancel notification if autoCancel === true
    if (notification.getAutoCancel() === true) {
      this.cancel(notification.getSender(), notification.id);
    }

    this.traceService.info(TraceModules.notification, 'Performing action ' + action.name + ' from notification id=' + notification.id);
  }

  public performGroupAction(sender: string): void {
    const action: Action | undefined = Array.from(this._notifications?.get(sender)!.values())[0].getActions().find(x => x.name === 'group');
    if (action !== undefined) {
      const callback: any = action.getCallback();
      callback(Array.from(this._notifications.get(sender)!.values()), action);
      this.traceService.info(TraceModules.notification, 'Performing group action ' + action.name + ' from sender ' + sender);
    } else {
      this.traceService.info(TraceModules.notification, 'No group action for sender' + sender);
    }
  }

  public hideSub(subId: number): void {
    const notifs: Notification[] = Array.from(this._notifications.get('newEvents')!.values());
    notifs.forEach(notif => {
      if (notif.getCustomData()[1] === subId) {
        this.cancel('newEvents', notif.id);
      }
    });
  }

  private differentPropertiesCheck(data1: CustomSetting[], data2: CustomSetting[]): boolean | undefined {
    for (let k = 0; k < data1.length; k++) {
      if (
        data1[k].name !== data2[k].name ||
        data1[k].label !== data2[k].label ||
        data1[k].color !== data2[k].color
      ) {
        return false;
      }
    }
    return true;
  }

  private differentCheckLenght(saved: NotifConfiguration, def: NotifConfiguration): boolean | undefined {
    // same customdata length, different checks length
    for (let i = 0; i < saved.getCustomData().length; i++) {
      if (saved.getCustomData()[i].data.length !== def.getCustomData()[i].data.length) {
        return false;
      } else {
        // same checks length, different properties
        const data1: CustomSetting[] = saved.getCustomData()[i].data;
        const data2: CustomSetting[] = def.getCustomData()[i].data;
        if (this.differentPropertiesCheck(data1, data2) === false) {
          return false;
        }
      }
    }
  }

  private equalToSaved(saved: NotifConfiguration, def: NotifConfiguration): boolean | any {
    if (
      (saved.getCustomSettings() === undefined && def.getCustomSettings() !== undefined) ||
      (saved.getCustomSettings() !== undefined && def.getCustomSettings() === undefined)
    ) {
      // one has customsettings but the other don't
      return false;
    } else if (saved.getCustomData() === undefined && def.getCustomData() === undefined) {
      // no customdata
      return true;
    } else if (
      (saved.getCustomData() === undefined && def.getCustomData() !== undefined) ||
      (saved.getCustomData() !== undefined && def.getCustomData() === undefined)
    ) {
      // one has customdata but the other don't
      return false;
    } else if (saved.getCustomData() !== undefined && def.getCustomData() !== undefined) {
      // both have customdata
      // different customdata length
      if (saved.getCustomData().length !== def.getCustomData().length) {
        return false;
      } else {
        // same customdata length, different checks length
        if (this.differentCheckLenght(saved, def) === false) {
          return false;
        }
        // everything is the same
        return true;
      }
    }
  }
}
