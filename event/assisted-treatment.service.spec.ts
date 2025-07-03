/* eslint-disable */
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { AssistedTreatmentProxyServiceBase, WSIProcedure } from '../wsi-proxy-api';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AssistedTreatmentService } from './assisted-treatment.service';
import { Observable, of } from 'rxjs';

const procedure: WSIProcedure = {
  AlertCount: 2,
  AlertSource: 'test',
  AlertTime: new Date(),
  IsClosed: false,
  ResetSteps: 0,
  Sequential: false,
  Steps: [],
  Subsequent: 0,
  Id: ''
}

class MockAssistedTreatmentServiceBase {
  public notifyConnectionState(): Observable<boolean> {
    return of(true);
  }

  public unSubscribeProcedure(): Observable<boolean> {
    return of(true);
  }

  public subscribeProcedure(): Observable<boolean> {
    return of(true);
  }

  public updateStep(): Observable<void> {
    return of();
  }
  
  public getProcedure(): Observable<WSIProcedure> {
    return of(procedure);
  }

  public procedureNotification(): Observable<WSIProcedure> {
    return of(procedure);
  }
}

// Tests  /////////////
describe('AssistedTreatmentService', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: AssistedTreatmentProxyServiceBase, useClass: MockAssistedTreatmentServiceBase },
        AssistedTreatmentService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
})
      .compileComponents();
  }));

  it('should create AssistedTreatmentService',
    inject([AssistedTreatmentService], (assistedTreatmentService: AssistedTreatmentService) => {
      expect(assistedTreatmentService instanceof AssistedTreatmentService).toBe(true);
    }
  ));

  it('should subscribe procedure',
    inject([AssistedTreatmentService], (assistedTreatmentService: AssistedTreatmentService) => {
      assistedTreatmentService.subscribeProcedure('test');
      assistedTreatmentService.procedureNotification().subscribe(res => {
        expect(res.alertSource).toEqual(procedure.AlertSource);
      });
    }
  ));

  it('should unsubscribe procedure',
    inject([AssistedTreatmentService], (assistedTreatmentService: AssistedTreatmentService) => {
      assistedTreatmentService.subscribeProcedure('test');
      assistedTreatmentService.unSubscribeProcedure().subscribe(res => {
        expect(res).toBeTrue();
      });
    }
  ));

  it('should get procedure',
    inject([AssistedTreatmentService], (assistedTreatmentService: AssistedTreatmentService) => {
      assistedTreatmentService.getProcedure('test').subscribe(res => {
        expect(res.AlertSource).toEqual(procedure.AlertSource);
      });
    }
  ));
});
