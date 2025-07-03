import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, ReplaySubject, Subscription } from 'rxjs';

import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { AssistedTreatmentProxyServiceBase } from '../wsi-proxy-api/assisted-treatment/assisted-treatment-proxy.service.base';
import { WSIProcedure, WSIStep } from '../wsi-proxy-api/assisted-treatment/data.model';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { AssistedTreatmentServiceBase } from './assisted-treatment.service.base';
import { Procedure, Step } from './data.model';

/**
 * Implementation for the Assisted Treatment service.
 *
 * @export
 * @class AssistedTreatmentService
 * @extends {AssistedTreatmentServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class AssistedTreatmentService extends AssistedTreatmentServiceBase {
  public subscribedOperatingProcedure: ReplaySubject<Procedure> = new ReplaySubject(1);

  private readonly eventProcedure: Procedure = new Procedure();
  private subscribedProcedure: BehaviorSubject<Procedure> = new BehaviorSubject(new Procedure());
  private procedureSubscription: Subscription | null = null;

  private gotDisconnected = false;
  private oPId = '';

  public constructor(
    private readonly traceService: TraceService,
    private readonly assistedTreatmentProxyService: AssistedTreatmentProxyServiceBase) {
    super();

    this.traceService.info(TraceModules.events, 'AssistedTreatment service created.');

    this.assistedTreatmentProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
  }

  public procedureNotification(): Observable<Procedure> {
    this.subscribedProcedure = new BehaviorSubject(this.eventProcedure);
    return this.subscribedProcedure.asObservable();
  }

  public unSubscribeProcedure(): Observable<boolean> {
    this.traceService.info(TraceModules.assistedTreatment, 'AssistedTreatmentService.unSubscribeProcedure() called');
    if (this.procedureSubscription !== null) {
      this.procedureSubscription.unsubscribe();
      this.procedureSubscription = null;
    }
    if (this.subscribedOperatingProcedure !== null) {
      this.subscribedOperatingProcedure.unsubscribe();
      this.subscribedOperatingProcedure = new ReplaySubject<Procedure>(1);
    }

    return this.assistedTreatmentProxyService.unSubscribeProcedure();
  }

  public subscribeProcedure(procedureId: string): void {
    this.procedureSubscription = this.assistedTreatmentProxyService.procedureNotification().subscribe(
      wsiProcedure => this.onProcedureNotification(wsiProcedure));

    this.traceService.info(TraceModules.events, 'AssistedTreatmentService.subscribeProcedure() called.');
    this.assistedTreatmentProxyService.subscribeProcedure(procedureId);
    this.oPId = procedureId;
  }

  public updateStep(procedureId: string, step: Step): void {
    /* eslint-disable @typescript-eslint/naming-convention */
    const step2Update: WSIStep = {
      Attachments: step.attachments!,
      Attributes: step.attributes!,
      AutomaticDPE: step.automaticDPE!,
      Configuration: step.configuration!,
      ErrorText: step.errorText!,
      FixedLink: step.fixedLink!,
      HasConfirmedExecution: step.hasConfirmedExecution!,
      IsCompleted: step.isCompleted!,
      ManagedType: step.managedType!,
      Notes: step.notes!,
      Operator: step.operator!,
      RuntimeStatus: step.runtimeStatus!,
      Status: step.status!,
      StepId: step.stepId!,
      StepName: step.stepName!
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    this.assistedTreatmentProxyService.updateStep(procedureId, step2Update);
  }

  public getProcedure(procID: string): Observable<WSIProcedure> {
    return this.assistedTreatmentProxyService.getProcedure(procID);
  }

  private onProcedureNotification(wsiProcedure: WSIProcedure): void {
    this.eventProcedure.initializeFromWSIProcedure(wsiProcedure);
    this.subscribedProcedure.next(this.eventProcedure);
    this.subscribedOperatingProcedure.next(this.eventProcedure);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.traceService.info(TraceModules.events, 'AssistedTreatmentService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this.gotDisconnected = true;
      if (this.subscribedProcedure !== undefined) {
        this.subscribedProcedure.error({ message: 'disconnected' });
      }
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.traceService.info(TraceModules.events, 'AssistedTreatmentService.onNotifyConnectionState(): Connection reestablished');
      this.gotDisconnected = false;
      if (this.assistedTreatmentProxyService.isSubscribed) {
        this.assistedTreatmentProxyService.subscribeProcedure(this.oPId);
      }
    }
  }
}
