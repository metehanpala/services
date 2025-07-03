import { Observable, Subject } from 'rxjs';

import { Link } from '../shared/data.model';

/**
 * Base class for the WSI files service.
 * See the WSI documentation for details.
 */
export abstract class FilesServiceBase {

  public abstract stopRequest: Subject<void>;

  /**
   * Gets the specified file from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {number } systemId The systemId, used to search file witin the project
   * @param {string } relativeFilePath relative file name witin the project. e.g. "libraries\Global_Events_HQ_1\MediaLibrary\anyfilename.xxx"
   * @returns {Observable<Blob>}
   *
   * @memberOf FilesBase
   */
  public abstract getFile(systemId: number, relativeFilePath: string): Observable<Blob>;

  /**
   * Gets the specified file from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {string } designation The designation, used to search document within the project
   * @returns {Observable<Blob>}
   *
   * @memberOf FilesBase
   */
  public abstract getDocument(designation: string): Observable<Blob>;

  /**
   * Gets the specified file from WSI.
   * See WSI documentation for more details.
   *
   * @abstract
   * @param {Link } link; a proper link for the file to retrieve. e.g. href=api\files\1libraries\Global_Events_HQ_1\MediaLibrary\anyfilename.xxx
   * @returns {Observable<Blob>}
   *
   * @memberOf FilesBase
   */
  public abstract getFileFromLink(link: Link): Observable<Blob>;

}
