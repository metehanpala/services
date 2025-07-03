import { Injectable } from '@angular/core';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';

import { DocumentServiceBase } from '../document/document.service.base';
import { GmsManagedTypes } from '../shared/gms-managed-types/gms-managed-types';
import { TraceModules } from '../shared/trace-modules';
import { BrowserObject } from '../wsi-proxy-api';
import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { PossibleActions } from './data.model';
import { ItemProcessingServiceBase } from './item-processing.service.base';

@Injectable({
  providedIn: 'root'
})
export class ItemProcessingService extends ItemProcessingServiceBase {
  private counter = 0;

  public constructor(
    private readonly traceService: TraceService,
    private readonly filesService: FilesServiceBase,
    private readonly documentService: DocumentServiceBase
  ) {
    super();
    this.traceService.info(TraceModules.itemProcessing, 'Service created.');
  }

  public async getPossibleActions(node: BrowserObject, reference: string, parameter?: string): Promise<PossibleActions> {
    if (node.Attributes.ManagedType === GmsManagedTypes.EXTERNAL_DOCUMENT.id) { // managed type - 78
      let isInWhitelist: boolean | undefined;
      let path: any;
      await this.documentService.getFilePath(node).toPromise().then(u => {
        path = u![0].Value.Value;
      }).catch(err => {
        this.traceService.error(TraceModules.itemProcessing, err);
      });
      await this.documentService.isInWhitelist(path).then(wl => {
        isInWhitelist = wl;
      });
      if (path) {
        if (path.slice(0, 7) !== 'file://') {
          if (isInWhitelist === true) {
            // in whitelist
            return PossibleActions.CanOpenInNewTab;
          } else {
            // not in whitelist
            return PossibleActions.OnlyOpenInNewTab;
          }
        } else {
          return PossibleActions.CanOpenInNewTab;
        }
      }
    } else if (node.Attributes.ManagedType === GmsManagedTypes.TRA_TECHOP.id) { // managed type - 90004
      return PossibleActions.OnlyOpenInNewTab;
    } else {
      return PossibleActions.Default;
    }
    return undefined!;
  }

  public openInNewTab(node: BrowserObject, reference: string, parameter?: string): void {

    const a = document.createElement('a');

    if (node.Attributes.ManagedType === GmsManagedTypes.TRA_TECHOP.id) {
      this.openTechOp(reference, parameter);
    }
    if (node.Attributes.ManagedType === GmsManagedTypes.EXTERNAL_DOCUMENT.id) { // managed type - 78
      if (reference.slice(0, 7) === 'file://') {
        this.filesService.getDocument(node.Designation).toPromise().then(resp => {
          const fileUrl: string = URL.createObjectURL(resp!);
          a.href = fileUrl;
          a.target = '_blank';
          a.click();
        });
      } else {
        a.href = reference;
        a.click();
      }
    }
  }

  private openTechOp(reference: string, parameter?: string): void {
    if (!isNullOrUndefined(parameter)) {
      const parser = new DOMParser();
      const dom = parser.parseFromString(parameter!, 'application/xml');
      const url = dom.documentElement.childNodes[5].childNodes[3].textContent;
      let postData = dom.documentElement.childNodes[3].childNodes[3].textContent;
      if (postData?.includes('pbfunc=') && url) {
        postData = postData.replace('pbfunc=', '');
        ++this.counter;
        const name = 'TechOp' + this.counter.toString(); // otherwise issues with re-open
        this.openWindow(name, url, postData);
      }
    }
  }

  private openWindow(name: string, url: string, postData: string): void {
    const form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', url);
    form.setAttribute('target', name);
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'pbfunc';
    input.value = postData;
    form.appendChild(input);
    document.body.appendChild(form);
    const w = window.open('post.htm', name);
    form.submit();
    document.body.removeChild(form);
  }
}
