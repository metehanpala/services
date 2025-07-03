import { Observable } from 'rxjs';

import { ValueDetails } from '../wsi-proxy-api/shared';
import { FileUrl } from './data.model';

export abstract class DocumentServiceBase {
  public abstract getFilePath(message: any): Observable<ValueDetails[]>;

  public abstract openTab(path: string): void;

  public abstract getWhitelist(): Observable<any>;

  public abstract getUrl(message: any, designation: string): Promise<FileUrl>;

  public abstract isInWhitelist(url: any): Promise<boolean>;

  public abstract stopRequest(): void;
}
