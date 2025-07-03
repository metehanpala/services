import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import {
  DisciplineWithSubgroup,
  EventColors,
  LocalTextGroupEntry,
  ObjectTypeWithSubgroup,
  SubTables,
  Tables,
  TextEntry } from '../wsi-proxy-api/tables/data.model';
import { TablesService } from './tables.service';

/* eslint-disable @typescript-eslint/naming-convention */

const disciplinesWithSubgroups: DisciplineWithSubgroup[] =
[
  {
    'DisciplineId': 0,
    'DisciplineDescriptor': 'Management System',
    'SubDisciplines': [
      {
        'Id': 0,
        'Descriptor': 'Unassigned'
      },
      {
        'Id': 1,
        'Descriptor': 'Applications'
      },
      {
        'Id': 2,
        'Descriptor': 'Communication'
      },
      {
        'Id': 3,
        'Descriptor': 'Supervision'
      },
      {
        'Id': 4,
        'Descriptor': 'System Settings'
      }
    ]
  },
  {
    'DisciplineId': 20,
    'DisciplineDescriptor': 'Building Infrastructure',
    'SubDisciplines': [
      {
        'Id': 0,
        'Descriptor': 'Unassigned'
      },
      {
        'Id': 21,
        'Descriptor': 'Elevators'
      },
      {
        'Id': 22,
        'Descriptor': 'Escalators'
      },
      {
        'Id': 23,
        'Descriptor': 'Data Network'
      },
      {
        'Id': 24,
        'Descriptor': 'I/O Monitoring'
      },
      {
        'Id': 25,
        'Descriptor': 'Emergency Equipment'
      }
    ]
  }
];

const objectTypesWithSubgroups: ObjectTypeWithSubgroup[] =
[
  {
    'ObjectTypeId': 0,
    'ObjectTypeDescriptor': 'Unassigned',
    'SubObjectTypes': [
      {
        'Id': 0,
        'Descriptor': 'Unassigned'
      }
    ]
  },
  {
    'ObjectTypeId': 100,
    'ObjectTypeDescriptor': 'Addressbook',
    'SubObjectTypes': [
      {
        'Id': 0,
        'Descriptor': 'Unassigned'
      }
    ]
  }
];

const globalDisciplines: any[] =
[
  {
    'Value': 0,
    'Text': 'Management System'
  },
  {
    'Value': 20,
    'Text': 'Building Infrastructure'
  },
  {
    'Value': 50,
    'Text': 'Building Automation'
  }
];

const globalDisciplinesWithSubdisciplines: any[] =
[
  {
    'Value': 0,
    'Text': 'Management System',
    'SubText': [
      {
        'Value': 0,
        'Text': 'Unassigned'
      },
      {
        'Value': 1,
        'Text': 'Applications'
      },
      {
        'Value': 2,
        'Text': 'Communication'
      },
      {
        'Value': 3,
        'Text': 'Supervision'
      },
      {
        'Value': 4,
        'Text': 'System Settings'
      }
    ]
  },
  {
    'Value': 20,
    'Text': 'Building Infrastructure',
    'SubText': [
      {
        'Value': 0,
        'Text': 'Unassigned'
      },
      {
        'Value': 21,
        'Text': 'Elevators'
      },
      {
        'Value': 22,
        'Text': 'Escalators'
      },
      {
        'Value': 23,
        'Text': 'Data Network'
      },
      {
        'Value': 24,
        'Text': 'I/O Monitoring'
      },
      {
        'Value': 25,
        'Text': 'Emergency Equipment'
      }
    ]
  }
];

const globalSubdisciplines: any[] =
[
  {
    'Value': 0,
    'Text': 'Unassigned'
  },
  {
    'Value': 1,
    'Text': 'Applications'
  },
  {
    'Value': 2,
    'Text': 'Communication'
  },
  {
    'Value': 3,
    'Text': 'Supervision'
  },
  {
    'Value': 4,
    'Text': 'System Settings'
  },
  {
    'Value': 21,
    'Text': 'Elevators'
  }
];

/* eslint-enable @typescript-eslint/naming-convention */

class RouterStub {}
// Tests  /////////////
describe('Tables Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        TablesService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create Tables Service',
    inject([TablesService], (tablesService: TablesService) => {
      expect(tablesService instanceof TablesService).toBe(true);
    }));

  it('should  call getGlobalIcon',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const body = 'imageVal';

      const tables: Tables = Tables.Disciplines;

      tablesService.getGlobalIcon(tables, 1).
        subscribe((data: string) => {
          expect(data).toBe(body);
        });

      // authenticationService should have made one request to GET login
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/global/disciplines/icons/1?format=PNG');

      req.flush(body);
      httpTestingController.verify();
    }));

  it('should call getGlobalIcon with objecttypes',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {
      const body = 'imageVal';

      const tables: Tables = Tables.ObjectTypes;

      tablesService.getGlobalIcon(tables, 2).
        subscribe((data: string) => {
          expect(data).toBe(body);
        });

      // authenticationService should have made one request to GET login
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/global/objecttypes/icons/2?format=PNG'
      );

      req.flush(body);
      httpTestingController.verify();
    }));

  it('should call getGlobalIcon() and fails',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const msg = '404';
      tablesService.getGlobalIcon(Tables.Disciplines, 1).subscribe(
        (data: string) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/global/disciplines/icons/1?format=PNG');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  // TO DO Investigate about a real case
  //  it("should call getGlobalIcon() and throw error when extract data",
  //   inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

  //     tablesService.getGlobalIcon(Tables.objecttypes, 1)
  //     .do((data: string) => {
  //     fail("should not respond");
  //     })
  //     .catch(err => {
  //       expect(err).toMatch(err);
  //       return Observable.of(null); // failure is the expected test result
  //     }).toPromise();
  //   }
  // ));

  it('should call getGlobalIcon() and throw error',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      tablesService.getGlobalIcon(Tables.Units, 1).pipe(
        tap((data: string) => {
          fail('should not respond');
        }),
        catchError(err => {
          expect(err).toMatch(err);
          return of(null); // failure is the expected test result
        })).toPromise();
    }
    ));

  it('should  call getTable()',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const tables: Tables = Tables.Disciplines;

      tablesService.getTable(Tables.SubDisciplines).
        subscribe((data: Map<number, string>) => {
          expect(data).toBe(data);
        });

      // authenticationService should have made one request to GET login
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/subdisciplines');

      httpTestingController.verify();
    }));

  it('should call getTable() and fails',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const msg = '404';
      tablesService.getTable(Tables.SubDisciplines).subscribe(
        (data: Map<number, string>) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/subdisciplines');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('should  call getTableWithSubgroup(disciplines)',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const table: Tables = Tables.Disciplines;
      tablesService.getTableWithSubgroup(table).
        subscribe((data: DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[]) => {
          expect((data as DisciplineWithSubgroup[]).length).toBe(2);
          expect((data as DisciplineWithSubgroup[])[0].DisciplineId).toBe(0);
          expect((data as DisciplineWithSubgroup[])[0].DisciplineDescriptor).toBe('Management System');
          expect((data as DisciplineWithSubgroup[])[0].SubDisciplines.length).toBe(5);
          expect((data as DisciplineWithSubgroup[])[0].SubDisciplines[0].Id).toBe(0);
          expect((data as DisciplineWithSubgroup[])[0].SubDisciplines[0].Descriptor).toBe('Unassigned');
          expect((data as DisciplineWithSubgroup[])[0].SubDisciplines[1].Descriptor).toBe('Applications');
        });

      // tablesService should have made one request
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/disciplines/subgroups');
      req.flush(disciplinesWithSubgroups);

      httpTestingController.verify();
    }));

  it('should  call getTableWithSubgroup(objecttypes)',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const table: Tables = Tables.ObjectTypes;
      tablesService.getTableWithSubgroup(table).
        subscribe((data: DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[]) => {
          expect((data as ObjectTypeWithSubgroup[]).length).toBe(2);
          expect((data as ObjectTypeWithSubgroup[])[0].ObjectTypeId).toBe(0);
          expect((data as ObjectTypeWithSubgroup[])[0].ObjectTypeDescriptor).toBe('Unassigned');
          expect((data as ObjectTypeWithSubgroup[])[0].SubObjectTypes.length).toBe(1);
          expect((data as ObjectTypeWithSubgroup[])[0].SubObjectTypes[0].Id).toBe(0);
          expect((data as ObjectTypeWithSubgroup[])[0].SubObjectTypes[0].Descriptor).toBe('Unassigned');
        });

      // tablesService should have made one request
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/objecttypes/subgroups');
      req.flush(objectTypesWithSubgroups);

      httpTestingController.verify();
    }));

  it('should call getTableWithSubgroup() and fails',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const msg = '404';
      tablesService.getTableWithSubgroup(Tables.Disciplines).subscribe(
        (data: DisciplineWithSubgroup[] | ObjectTypeWithSubgroup[]) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/disciplines/subgroups');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('should  call getGlobalText(disciplines)',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const table: Tables = Tables.Disciplines;
      tablesService.getGlobalText(table, false).
        subscribe((data: TextEntry[]) => {
          expect(data.length).toBe(3);
          expect(data[0].value).toBe(0);
          expect(data[0].text).toBe('Management System');
          expect(data[0].subText).toBe(null);
        });

      // tablesService should have made one request
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/global/disciplines/text');
      req.flush(globalDisciplines);

      httpTestingController.verify();
    }));

  it('should  call getGlobalText(disciplines, true)',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const table: Tables = Tables.Disciplines;
      tablesService.getGlobalText(table, true).
        subscribe((data: TextEntry[]) => {
          expect(data.length).toBe(2);
          expect(data[1].value).toBe(20);
          expect(data[1].text).toBe('Building Infrastructure');
          expect(data[1].subText?.length).toBe(6);
          expect(data[1].subText![1].value).toBe(21);
          expect(data[1].subText![1].text).toBe('Elevators');
        });

      // tablesService should have made one request
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/global/disciplines/nestedText');
      req.flush(globalDisciplinesWithSubdisciplines);

      httpTestingController.verify();
    }));

  it('should  call getGlobalText(subdisciplines)',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const table: Tables = Tables.SubDisciplines;
      tablesService.getGlobalText(table, false).
        subscribe((data: TextEntry[]) => {
          expect(data.length).toBe(6);
          expect(data[2].value).toBe(2);
          expect(data[2].text).toBe('Communication');
          expect(data[2].subText).toBe(null);
        });

      // tablesService should have made one request
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/global/subdisciplines/text');
      req.flush(globalSubdisciplines);

      httpTestingController.verify();
    }));

  // not see a reason to throw an error
  //  it("should call getTable() and throw error",
  //   inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

  //     tablesService.getTable(1)
  //     .do( (data: Map<Tables, string>) => {
  //     fail("should not respond");
  //     })
  //     .catch(err => {
  //       expect(err).toMatch(err);
  //       return Observable.of(null); // failure is the expected test result
  //     }).toPromise();
  //   }
  // ));

  it('should call getSubTable()',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {
      tablesService.getSubTable(Tables.Categories, SubTables.Colors).
        subscribe(
          (data: Map<number, Map<EventColors, string>>) => {
            expect(data).toBe(data);
          });

      // tablesService should have made one request to GET getSubTable
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/categories/subtables/colors');

      httpTestingController.verify();
    }));

  it('should call getSubTable() and Fails',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const msg = '404';
      tablesService.getSubTable(Tables.Categories, SubTables.Colors).subscribe(
        (data: Map<number, Map<EventColors, string>>) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/categories/subtables/colors');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  //  it("should call getSubTable() and throw error when extract data",
  //   inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

  //    tablesService.getSubTable(Tables.categories, SubTables.colors)
  //     .do((data: Map<number, Map<EventColors, string>>) => {
  //     fail("should not respond");
  //     })
  //     .catch(err => {
  //       expect(err).toMatch(err);
  //       return Observable.of(null); // failure is the expected test result
  //     }).toPromise();
  //   }
  // ));

  it('should call getIconForTextGroupEntry()',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      tablesService.getIconForTextGroupEntry('1', 'TxG_BACnetNetworkStatus', '0')
        .subscribe((data: string) => {
          expect(data).toBe(data);
        });

      // authenticationService should have made one request to GET login
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/local/1/TxG_BACnetNetworkStatus/icons/0');

      httpTestingController.verify();
    }));

  it('should call getIconForTextGroupEntry() and Fails',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const msg = '404';
      tablesService.getIconForTextGroupEntry('1', 'TxG_BACnetNetworkStatus', '0').subscribe(
        (data: string) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/local/1/TxG_BACnetNetworkStatus/icons/0');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('should call getTextAndColorForTextGroupEntry()',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      tablesService.getTextAndColorForTextGroupEntry('1', 'TxG_BACnetNetworkStatus', '0')
        .subscribe((data: LocalTextGroupEntry) => {
          expect(data).toBe(data);
        });

      // authenticationService should have made one request to GET login
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/local/1/TxG_BACnetNetworkStatus/text/0');

      httpTestingController.verify();
    }));

  it('should call getTextAndColorForTextGroupEntry() and Fails',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const msg = '404';
      tablesService.getTextAndColorForTextGroupEntry('1', 'TxG_BACnetNetworkStatus', '0').subscribe(
        (data: LocalTextGroupEntry) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/local/1/TxG_BACnetNetworkStatus/text/0');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));

  it('should call getTextAndColorForTextGroupEntries()',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      tablesService.getTextAndColorForTextGroupEntries('1', 'TxG_BACnetNetworkStatus')
        .subscribe((data: LocalTextGroupEntry[]) => {
          expect(data).toBe(data);
        });

      // authenticationService should have made one request to GET login
      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/local/1/TxG_BACnetNetworkStatus/text');

      httpTestingController.verify();
    }));

  it('should call getTextAndColorForTextGroupEntries() and Fails',
    inject([HttpTestingController, TablesService], (httpTestingController: HttpTestingController, tablesService: TablesService) => {

      const msg = '404';
      tablesService.getTextAndColorForTextGroupEntries('1', 'TxG_BACnetNetworkStatus').subscribe(
        (data: LocalTextGroupEntry[]) => fail('expected that %s to fail: ' + data),
        (error: HttpErrorResponse) => expect(error.message).toContain(msg)
      );

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/tables/local/1/TxG_BACnetNetworkStatus/text');

      // respond with a 404 and the error message in the body
      req.flush(msg, { status: 404, statusText: 'Not Found' });
    }));
});
