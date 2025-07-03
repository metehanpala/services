import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  AuthenticationServiceBase,
  ChangePasswordModel,
  ErrorNotificationServiceBase,
  MockTraceService,
  MockWsiEndpointService,
  PasswordPolicyModel,
  TraceService,
  UserAccountType,
  UserInfo
} from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { UsersService } from './users.service';

// Test constants
const TEST_API_URL = 'protocol://site:port/host';
const TEST_USERNAME = 'testUser';
const TEST_CURRENT_PASSWORD = 'currentPass';
const TEST_NEW_PASSWORD = 'newPass';

// Mock data
const mockUserInfo: UserInfo = {
  UserName: TEST_USERNAME,
  AccountType: UserAccountType.DesigoCC,
  OpenIdLoginUri: ''
};

const mockPasswordPolicy: PasswordPolicyModel = {
  MinimumLowercaseLength: '1',
  MinimumUppercaseLength: '1',
  MinimumDigitLength: '1',
  MinimumSpecialCharLength: '1',
  MinimumPasswordLength: '8',
  PasswordComplexity: true,
  AllowedSpecialChars: '!@#$%^&*'
};

class RouterStub { }
// Tests  /////////////
describe('UsersService', () => {
  let httpTestingController: HttpTestingController;
  let usersService: UsersService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: TEST_API_URL },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        UsersService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    usersService = TestBed.inject(UsersService);
  }));

  afterEach(() => {
    // Verify that no unmatched requests are outstanding.
    httpTestingController.verify();
  });

  it('should create UsersService', () => {
    expect(usersService instanceof UsersService).toBe(true);
  });

  describe('changePassword', () => {
    const mockChangePasswordModel: ChangePasswordModel = {
      username: TEST_USERNAME,
      currentPassword: TEST_CURRENT_PASSWORD,
      newPassword: TEST_NEW_PASSWORD
    };

    it('should successfully change password', () => {
      usersService.changePassword(mockChangePasswordModel).subscribe({
        next: response => {
          expect(response).toBeUndefined();
        }
      });

      const req = httpTestingController.expectOne(request =>
        request.url === `${TEST_API_URL}/api/users/password` ||
        request.url === `//site:port/host/api/users/password`
      );
      expect(req.request.method).toBe('PUT');
      req.flush(null);
    });

    it('should throw error for invalid arguments when username is empty', () => {
      const invalidModel: ChangePasswordModel = {
        ...mockChangePasswordModel,
        username: ''
      };

      usersService.changePassword(invalidModel).subscribe(
        () => fail('should have failed with invalid arguments'),
        (error: Error) => {
          expect(error.message).toBe('Invalid arguments!');
        }
      );
    });

    it('should throw error for invalid arguments when current password is empty', () => {
      const invalidModel: ChangePasswordModel = {
        ...mockChangePasswordModel,
        currentPassword: ''
      };

      usersService.changePassword(invalidModel).subscribe(
        () => fail('should have failed with invalid arguments'),
        (error: Error) => {
          expect(error.message).toBe('Invalid arguments!');
        }
      );
    });

    it('should throw error for invalid arguments when new password is empty', () => {
      const invalidModel: ChangePasswordModel = {
        ...mockChangePasswordModel,
        newPassword: ''
      };

      usersService.changePassword(invalidModel).subscribe(
        () => fail('should have failed with invalid arguments'),
        (error: Error) => {
          expect(error.message).toBe('Invalid arguments!');
        }
      );
    });

    it('should handle HTTP error response', done => {
      usersService.changePassword(mockChangePasswordModel).subscribe({
        next: () => {
          fail('should have failed with the HTTP error');
          done();
        },
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        }
      });

      const req = httpTestingController.expectOne(`${TEST_API_URL}/api/users/password`);
      expect(req.request.method).toBe('PUT');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getLoginInfo', () => {
    it('should successfully get user login info', () => {
      usersService.getLoginInfo(TEST_USERNAME).subscribe({
        next: response => {
          expect(response).toEqual(mockUserInfo);
        }
      });

      const req = httpTestingController.expectOne(request =>
        request.url === `${TEST_API_URL}/api/users/logininfo/${TEST_USERNAME}` ||
        request.url === `//site:port/host/api/users/logininfo/${TEST_USERNAME}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockUserInfo);
    });

    it('should throw error for empty username', () => {
      usersService.getLoginInfo('').subscribe({
        next: () => fail('should have failed with invalid arguments'),
        error: (error: Error) => {
          expect(error.message).toBe('Invalid arguments!');
        }
      });
    });

    it('should handle HTTP error response', () => {
      usersService.getLoginInfo(TEST_USERNAME).subscribe({
        next: () => fail('should have failed with the HTTP error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpTestingController.expectOne(request =>
        request.url === `${TEST_API_URL}/api/users/logininfo/${TEST_USERNAME}` ||
        request.url === `//site:port/host/api/users/logininfo/${TEST_USERNAME}`
      );
      expect(req.request.method).toBe('GET');
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });
  });
});
