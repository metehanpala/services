import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';

import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { Link } from '../wsi-proxy-api/shared/data.model';

/**
 * Mock Category service.
 *
 * @export
 * @class Mock CategoryService
 * @extends {CategoryBase}
 */
@Injectable({
  providedIn: 'root'
})
export class MockFilesService extends FilesServiceBase {
  public observer: Observer<Blob> | undefined;
  public stopRequest!: Subject<void>;

  public constructor() {
    super();
  }

  /**
   * Gets the categories with the associated color definitions for WSI.
   *
   * @returns {Observable<Category[]>}
   *
   * @memberOf CategoryService
   */
  public getFile(systemId: number, relativeFilePath: string): Observable<Blob> {
    return new Observable((observer: Observer<Blob>) => {
      this.observer = observer;
    });
  }

  public getDocument(designation: string): Observable<Blob> {
    return this.createObservable();
  }

  public getFileFromLink(link: Link): Observable<Blob> {
    return this.createObservable();
  }

  public getFlexReport(systemId: number, relativepath: string): Observable<Blob> {
    return this.createObservable();
  }

  private createObservable(): Observable<Blob> {
    return new Observable((observer: Observer<Blob>) => {
      this.observer = observer;
    });
  }

}
