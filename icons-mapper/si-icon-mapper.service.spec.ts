import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TablesData, TablesEx } from './data.model';
import { SiIconMapperService } from './si-icon-mapper.service';

const textGroupsAndIcons: TablesData = {
  'disciplines': [
    {
      'id': 0,
      'descriptor': 'Management System',
      'icon': 'element-workstation'
    }
  ],
  'subdisciplines': [
    {
      'id': 2,
      'descriptor': 'Communication',
      'icon': 'element-workstation'
    }
  ],
  'objecttypes': [
    {
      'id': 100,
      'descriptor': 'Addressbook',
      'icon': 'element-user-group'
    }
  ],
  'subtypes': [
    {
      'id': 8001,
      'descriptor': 'Area',
      'icon': 'element-area'
    }
  ]
};

class RouterStub {}

describe('SiIconMapper Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: 'tablesDataPath', useValue: 'https://fake-server.com' },
        SiIconMapperService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create SiIconMapperService',
    inject([SiIconMapperService], (siIconMapperService: SiIconMapperService) => {
      expect(siIconMapperService instanceof SiIconMapperService).toBe(true);
    }));

  it('should get the correct response for objectTypes', (done: DoneFn) => {
    inject([HttpTestingController, SiIconMapperService], (httpTestingController: HttpTestingController, siIconMapperService: SiIconMapperService) => {

      siIconMapperService.getTablesData().subscribe(response => {
        expect(response).toEqual(textGroupsAndIcons);

        siIconMapperService.getGlobalIcon(TablesEx.Disciplines, 0).subscribe(res => {
          expect(res).toEqual('element-workstation');
        });

        const objIcon: string = siIconMapperService.getGlobalIconSync(TablesEx.ObjectTypes, 100);
        expect(objIcon).toEqual('element-user-group');
        done();
      });

      // SiIconMapperService should have made one request to GET tablesData
      const req: TestRequest = httpTestingController.expectOne('https://fake-server.com');

      req.flush(textGroupsAndIcons);
      httpTestingController.verify();
    })();
  });

  it('should get the correct response for objectSubTypes', (done: DoneFn) => {
    inject([HttpTestingController, SiIconMapperService], (httpTestingController: HttpTestingController, siIconMapperService: SiIconMapperService) => {

      siIconMapperService.getTablesData().subscribe(response => {
        expect(response).toEqual(textGroupsAndIcons);

        siIconMapperService.getGlobalIcon(TablesEx.ObjectSubTypes, 8001).subscribe(res => {
          expect(res).toEqual('element-area');
        });

        const subObjIcon: string = siIconMapperService.getGlobalIconSync(TablesEx.ObjectSubTypes, 8001);
        expect(subObjIcon).toEqual('element-area');
        done();
      });

      // SiIconMapperService should have made one request to GET tablesData
      const req: TestRequest = httpTestingController.expectOne('https://fake-server.com');

      req.flush(textGroupsAndIcons);
      httpTestingController.verify();
    })();
  });

});
