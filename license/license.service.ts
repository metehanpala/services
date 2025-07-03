import { Injectable } from '@angular/core';
import { Action, CustomData, CustomSetting, NotifConfiguration, Notification, NotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Observer, of, Subscription } from 'rxjs';
import { map, share } from 'rxjs/operators';

import { TablesEx } from '../icons-mapper/data.model';
import { SiIconMapperService } from '../icons-mapper/si-icon-mapper.service';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { TimerServiceBase } from '../timer/timer.service.base';
import { LicenseWsi } from '../wsi-proxy-api/license/data.model';
import { LicenseProxyServiceBase } from '../wsi-proxy-api/license/license-proxy.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { EventColors, IconImage, Tables, TextEntry } from '../wsi-proxy-api/tables/data.model';
import { TablesServiceBase } from '../wsi-proxy-api/tables/tables.service.base';
import { LicenseServiceBase } from './license.service.base';

/**
 * Event service.
 * Provides the functionality to read licenses from WSI.
 *
 * @export
 * @class LicenseService
 * @extends {LicenseServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class LicenseService extends LicenseServiceBase {
  private licenseSubscription: Subscription | null = null;
  private gotDisconnected = false;
  private readonly _configuration: NotifConfiguration | null = null;
  private readonly _notificationSenderLicense = 'license';
  private readonly _license: BehaviorSubject<LicenseWsi | null> = new BehaviorSubject<LicenseWsi | null>(null);
  private _subscribed = 0;
  private _licenseConfigDescription = '';
  private _licenseText = '';
  private _licenseNotifText = '';
  private _licenseNotifText2 = '';

  constructor(
    private readonly traceService: TraceService,
    private readonly licenseProxyService: LicenseProxyServiceBase,
    private readonly timerService: TimerServiceBase,
    private readonly notificationService: NotificationServiceBase,
    private readonly translateService: TranslateService) {
    super();
    this.traceService.info(TraceModules.license, 'LicenseService created.');
    this.licenseProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
    this.translateService.get([
      'GMS_SERVICES.LICENSE_DESCRIPTION'
    ]).subscribe(res => {
      this._licenseConfigDescription = res['GMS_SERVICES.LICENSE_DESCRIPTION'];

      const licenseConfig = new NotifConfiguration(this._licenseConfigDescription)
        .setIcon('element-prime')
        .setShow(true)
        .setSound(true)
        .setToast('none')
        .setPersistent(true)
        .setGroupaction(false);
      this.notificationService.register(this._notificationSenderLicense, licenseConfig);
    });
  }

  public licenseNotification(): Observable<LicenseWsi | null> {
    return this._license.asObservable();
  }

  public unSubscribeLicense(): Observable<boolean> {
    this.traceService.info(TraceModules.license, 'LicenseService.unSubscribeLicense() called.');

    if (this._subscribed > 0) {
      this._subscribed--;

      if (this._subscribed === 0) {
        if (this.licenseSubscription !== null) {
          this.licenseSubscription.unsubscribe();
          this.licenseSubscription = null;
        }
        return this.licenseProxyService.unsubscribeLicense();
      }
    }
    return of(true);
  }

  public subscribeLicense(): void {
    this.traceService.info(TraceModules.license, 'LicenseService.subscribeLicense() called.');

    if (this._subscribed === 0) {
      this.licenseSubscription = this.licenseProxyService.licenseNotification().subscribe(license => this.onLicenseNotification(license));
      this.licenseProxyService.subscribeLicense();
    }
    this._subscribed++;
  }

  private onLicenseNotification(licenseWsi: LicenseWsi): void {
    this.traceService.info(TraceModules.license, 'LicenseService.onLicenseNotification() called.');

    if (licenseWsi !== null) {
      this._license.next(licenseWsi);
      this.ManagerLicenseNotification(licenseWsi);
    } else {
      this.traceService.error(TraceModules.license, 'LicenseService.onLicenseNotification() license is null.');
    }
  }

  private ManagerLicenseNotification(license: LicenseWsi): void {
    // 0 developer license
    // 1 demo mode
    // 2 courtesy
    // 3 engineering
    // 4 normal
    if (license.LicenseModeValue !== 0 && license.LicenseModeValue !== 4) {
      let start: number;
      if (this.traceService.isDebugEnabled(TraceModules.eventNotifications)) {
        this.traceService.info(TraceModules.license, 'LicenseService.onLicenseNotification() called.');
        start = performance.now();
      }

      const notification = new Notification(0)
        .setIcon('element-prime')
        .setAutoCancel(false)
        .setOverwrite(true);

      if (license.ExpirationTime !== undefined && license.ExpirationTime !== 0) {
        const days: number = Math.floor(license.ExpirationTime / 86400);
        const hours: number = Math.floor((license.ExpirationTime - days * 86400) / 3600);
        const minutes: number = Math.floor((license.ExpirationTime - (days * 86400 + hours * 3600)) / 60);
        let time = '';
        if (days > 0) {
          time = days + ' days ';
        } else {
          time = hours + 'h ' + minutes + 'm';
        }

        this.translateService.get([
          'GMS_SERVICES.LICENSE_TEXT',
          'GMS_SERVICES.LICENSE_NOTIF_TEXT',
          'GMS_SERVICES.LICENSE_NOTIF_TEXT2'
        ], {
          license: license.LicenseModeName,
          time
        }).subscribe(res => {
          this._licenseText = res['GMS_SERVICES.LICENSE_TEXT'];
          this._licenseNotifText = res['GMS_SERVICES.LICENSE_NOTIF_TEXT'];
          this._licenseNotifText2 = res['GMS_SERVICES.LICENSE_NOTIF_TEXT2'];

          let text = '';
          if (license.LicenseModeValue === 1 || license.LicenseModeValue === 2) {
            text = this._licenseNotifText;
          } else {
            text = this._licenseNotifText2;
          }
          notification.setText(text).setToastText(text);
          notification.setTitle(this._licenseText);
          notification.setToastTitle(this._licenseText);
        });
      }

      this.notificationService.notify(this._notificationSenderLicense, Object.create(notification));
    } else {
      this.notificationService.cancelAll(this._notificationSenderLicense);
    }
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.traceService.info(TraceModules.license, 'LicenseService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.gotDisconnected = false;
      this.licenseProxyService.subscribeLicense();

      this.traceService.info(TraceModules.license,
        'LicenseService.onNotifyConnectionState(): Connection reestablished');
    }
  }
}
