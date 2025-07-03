import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, MockTraceService, TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { NavbarCommunicationService } from './navbar-communication.service';

class RouterStub {}
describe('NavbarCommunication Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        NavbarCommunicationService,
        AuthenticationServiceBase,
        TranslateService
      ]
    })
      .compileComponents();
  }));

  it('should create NavbarCommunication Service',
    inject([NavbarCommunicationService], (navbarCommunicationService: NavbarCommunicationService) => {
      expect(navbarCommunicationService instanceof NavbarCommunicationService).toBe(true);
    }));

});
