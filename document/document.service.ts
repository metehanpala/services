import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { ValueServiceBase } from '../values/value.service.base';
import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { ValueDetails } from '../wsi-proxy-api/shared';
import { FileUrl } from './data.model';
import { DocumentServiceBase } from './document.service.base';

@Injectable({
  providedIn: 'root'
})
export class DocumentService extends DocumentServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly valueService: ValueServiceBase,
    private readonly filesService: FilesServiceBase,
    private readonly http: HttpClient
  ) {
    super();
    this.traceService.info(TraceModules.document, 'Service created.');
  }

  public getFilePath(message: any): Observable<ValueDetails[]> {
    const propertyId: string = message.ObjectId + '.' + message.Attributes.DefaultProperty;
    return this.valueService.readValue(propertyId);
  }

  public openTab(path: string): void {
    window.open(path, '_blank');
  }

  public getWhitelist(): Observable<any> {
    return this.http.get('./config/whitelist.settings.json').
      pipe(catchError((err: HttpErrorResponse) => {
        this.traceService.warn('Error getting whitelist configuration: ' + err);
        return of({ 'whitelist': [] });
      }));
  }

  public async isInWhitelist(url: any): Promise<boolean> {
    let isInWhitelist = false;
    await this.getWhitelist().toPromise().then(res => {
      if (res.whitelist.find((x: any) => x === url) !== undefined) {
        isInWhitelist = true;
      } else {
        isInWhitelist = false;
      }
    });
    return isInWhitelist;
  }

  public stopRequest(): void {
    this.filesService.stopRequest.next();
  }

  public async getUrl(message: any, designation: string): Promise<FileUrl> {
    let fileUrl: any;
    let type: string | undefined;
    let path: string | undefined;

    await this.getFilePath(message).toPromise().then(res => {
      path = res![0].Value.Value;
    });

    // get a file from documents folder
    if (path?.slice(0, 7) === 'file://') {
      await this.filesService.getDocument(designation).toPromise().then(resp => {
        fileUrl = resp;
        type = 'file';
      }).catch(err => {
        type = undefined;
        fileUrl = undefined;
      });
    } else {
      fileUrl = path;
      type = 'url';
    }
    return { type, path, url: fileUrl };
  }
}
