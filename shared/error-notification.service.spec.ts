import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { ErrorDisplayItem, ErrorDisplayMode, ErrorDisplayState, ErrorNotificationServiceBase, MockTraceService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from './error-notification.service';

// class RouterStub {}
// Tests  /////////////
describe('Error Notification Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService }
      ]
    })
      .compileComponents();
  }));

  it('Create Error Notification Service',
    inject([ErrorNotificationServiceBase], (errorService: ErrorNotificationServiceBase) => {
      expect(errorService instanceof ErrorNotificationService).toBe(true);
    }));

  it('1. Check setting error item and reading message and title.',
    inject([ErrorNotificationServiceBase], (errorService: ErrorNotificationServiceBase) => {
      const errorItem: ErrorDisplayItem = new ErrorDisplayItem(ErrorDisplayMode.Toast, ErrorDisplayState.Inactive);
      errorItem.setDisplayMessage('Test Message');
      errorItem.setDisplayTitle('Test Title');

      errorService.errorChanged.subscribe((item: ErrorDisplayItem) => {
        expect(item.state).toBe(ErrorDisplayState.Inactive);
        expect(item.mode).toBe(ErrorDisplayMode.Toast);
        expect(item.debounceTime).toBeUndefined();
        item.getMessage(undefined!).subscribe(msg => expect(msg).toBe('Test Message'));
        item.getTitle(undefined!).subscribe(title => expect(title).toBe('Test Title'));
      });
      errorService.notifyErrorChange(errorItem);
    }
    ));

  it('2. Check setting error item and reading message and title',
    inject([ErrorNotificationServiceBase], (errorService: ErrorNotificationServiceBase) => {
      const errorItem: ErrorDisplayItem = new ErrorDisplayItem(ErrorDisplayMode.Modal, ErrorDisplayState.Active);
      errorItem.setDisplayMessage('Test Message 2');
      errorItem.setDisplayTitle('Test Title 2');

      errorService.errorChanged.subscribe((item: ErrorDisplayItem) => {
        expect(item.state).toBe(ErrorDisplayState.Active);
        expect(item.mode).toBe(ErrorDisplayMode.Modal);
        expect(item.debounceTime).toBeUndefined();
        item.getMessage(undefined!).subscribe(msg => expect(msg).toBe('Test Message 2'));
        item.getTitle(undefined!).subscribe(title => expect(title).toBe('Test Title 2'));
      });
      errorService.notifyErrorChange(errorItem);
    }
    ));
});
