/* eslint-disable */
import { inject, TestBed, waitForAsync } from "@angular/core/testing";

import { Action, MockTraceService, NotifConfiguration, Notification, NotificationServiceBase, SettingsServiceBase, TraceService } from "@gms-flex/services-common";
import { NotificationService } from "./notification.service";
import { Observable, of } from "rxjs";

export class MockSettingsServiceBase {
  public getSettings(settingId: string): Observable<string | undefined> {
    return of(undefined);
  }

  public putSettings(settingId: string, settingValue: string): Observable<boolean> {
    return of(true);
  }
 }

   ////////  Tests  /////////////
describe('Notification Service', () => {
    beforeEach( waitForAsync(() => {
    TestBed.configureTestingModule({
        imports: [ ],
        providers: [
        { provide: TraceService,    useClass: MockTraceService },
        { provide: NotificationServiceBase, useClass: NotificationService },
        { provide: SettingsServiceBase, useClass: MockSettingsServiceBase }
        ]
    })
    .compileComponents();
    }));

    it("should create Notification Service",
    inject([NotificationServiceBase], (notificationService: NotificationServiceBase) => {
        expect(notificationService instanceof NotificationService).toBe(true);
    }));

    it ("should get a notification",
    inject([NotificationServiceBase], (notificationService: NotificationServiceBase) => {
        const _notifications: Notification[] = [];
        notificationService.subscribeNotifications().subscribe(res => {
            if (res.getState() === 1) {
              const toEdit: number = _notifications.findIndex(n => n.id === res.id);
              if (toEdit >= 0) {
                _notifications[toEdit] = res;
              }
              else {
                _notifications.push(res);
              }
            }
            else {
              const toDelete: number = _notifications.findIndex(n => n.id === res.id);
              _notifications.splice(toDelete);
            }
        });

        const configuration: NotifConfiguration = new NotifConfiguration("test").setShow(true).setToast("banner");
        notificationService.register("testing", configuration);

        const notification: Notification = new Notification(1)
            .setTitle("test")
            .setText("test")
            .setAutoCancel(true);
        notificationService.notify("testing", notification);

        expect(notificationService.getActiveNotifications("testing").length).toEqual(1);
        expect(notificationService.getActiveNotifications("testing")[0].getTitle()).toEqual("test");
        expect(_notifications.length).toEqual(1);
        expect(_notifications[0].getTitle()).toEqual("test");
    }));

    it ("should update a notification",
    inject([NotificationServiceBase], (notificationService: NotificationServiceBase) => {
        const _notifications: Notification[] = [];
        notificationService.subscribeNotifications().subscribe(res => {
            if (res.getState() === 1) {
              const toEdit: number = _notifications.findIndex(n => n.id === res.id);
              if (toEdit >= 0) {
                _notifications[toEdit] = res;
              }
              else {
                _notifications.push(res);
              }
            }
            else {
              const toDelete: number = _notifications.findIndex(n => n.id === res.id);
              _notifications.splice(toDelete);
            }
        });

        const configuration: NotifConfiguration = new NotifConfiguration("test").setShow(true).setToast("banner");
        notificationService.register("testing", configuration);

        const notification: Notification = new Notification(1)
            .setTitle("test")
            .setText("test")
            .setAutoCancel(true);
        notificationService.notify("testing", notification);
        const notificationUpdated: Notification = new Notification(1)
            .setTitle("testUPDATED")
            .setText("testUPDATED")
            .setAutoCancel(true);
        notificationService.notify("testing", notificationUpdated);

        expect(notificationService.getActiveNotifications("testing").length).toEqual(1);
        expect(notificationService.getActiveNotifications("testing")[0].getTitle()).toEqual("testUPDATED");
        expect(_notifications.length).toEqual(1);
        expect(_notifications[0].getTitle()).toEqual("testUPDATED");
    }));

    it ("should cancel a notification",
    inject([NotificationServiceBase], (notificationService: NotificationServiceBase) => {
        const _notifications: Notification[] = [];
        notificationService.subscribeNotifications().subscribe(res => {
            if (res.getState() === 1) {
              const toEdit: number = _notifications.findIndex(n => n.id === res.id);
              if (toEdit >= 0) {
                _notifications[toEdit] = res;
              }
              else {
                _notifications.push(res);
              }
            }
            else {
              const toDelete: number = _notifications.findIndex(n => n.id === res.id);
              _notifications.splice(toDelete);
            }
        });

        const configuration: NotifConfiguration = new NotifConfiguration("test").setShow(true).setToast("banner");
        notificationService.register("testing", configuration);

        const notification: Notification = new Notification(1)
            .setTitle("test")
            .setText("test")
            .setAutoCancel(true);
        notificationService.notify("testing", notification);

        expect(notificationService.getActiveNotifications("testing").length).toEqual(1);

        notificationService.cancel("testing", 1);

        expect(notificationService.getActiveNotifications("testing").length).toEqual(0);
        expect(_notifications.length).toEqual(0);
    }));

    it ("should cancel all notifications",
    inject([NotificationServiceBase], (notificationService: NotificationServiceBase) => {
        const _notifications: Notification[] = [];
        notificationService.subscribeNotifications().subscribe(res => {
            if (res.getState() === 1) {
              const toEdit: number = _notifications.findIndex(n => n.id === res.id);
              if (toEdit >= 0) {
                _notifications[toEdit] = res;
              }
              else {
                _notifications.push(res);
              }
            }
            else {
              const toDelete: number = _notifications.findIndex(n => n.id === res.id);
              _notifications.splice(toDelete);
            }
        });

        const configuration: NotifConfiguration = new NotifConfiguration("test").setShow(true).setToast("banner");
        notificationService.register("testing", configuration);

        notificationService.notify("testing", new Notification(1));
        notificationService.notify("testing", new Notification(2));
        notificationService.notify("testing", new Notification(3));

        expect(notificationService.getActiveNotifications("testing").length).toEqual(3);

        notificationService.cancelAll("testing");

        expect(notificationService.getActiveNotifications("testing").length).toEqual(0);
        expect(_notifications.length).toEqual(0);
    }));

    it("should execute notification action",
    inject([NotificationServiceBase], (notificationService: NotificationServiceBase) => {
      const _notifications: Notification[] = [];
      notificationService.subscribeNotifications().subscribe(res => {
        if (res.getState() === 1) {
          const toEdit: number = _notifications.findIndex(n => n.id === res.id);
          if (toEdit >= 0) {
            _notifications[toEdit] = res;
          }
          else {
            _notifications.push(res);
          }
        }
        else {
          const toDelete: number = _notifications.findIndex(n => n.id === res.id);
          _notifications.splice(toDelete);
        }
      });

      const configuration: NotifConfiguration = new NotifConfiguration("test").setShow(true).setToast("banner");
      notificationService.register("testing", configuration);

      let callback: string = "";

      function testPrint(): boolean {
        callback = "test";
        return true;
      }

      const action: Action = new Action("test").setCallback(testPrint.bind(this)).setDescription("test");

      notificationService.notify("testing", new Notification(1).setActions([action]));

      expect(callback).toEqual("");

      notificationService.performAction(_notifications[0], _notifications[0].getActions()[0]);

      expect(callback).toEqual("test");
    }));
   });
