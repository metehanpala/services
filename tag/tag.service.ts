import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from "@gms-flex/services-common";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { TraceModules, WsiUtilityService } from "../shared";
import { WsiEndpointService } from "../wsi-endpoint";
import { TagsKeyValueInfo } from "./tags-key-value.info";
import { TagsRequestRepresentation } from "./tags-request-representation";
import { TagsResponseRepresentation } from "./tags-response-representation";

const tagsUrl = "/api/tags";
const tagsQueryUrl = "/api/tags/query";

@Injectable({
  providedIn: 'root'
})
export class TagService {
  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } httpClient  The http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   */
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService) {

    this.traceService.info(TraceModules.diagnostics, 'Tags service created.');
  }

  public getTags(designation: string, keys: string[]): Observable<TagsKeyValueInfo | undefined> {
    const tagsRequestRepresentation: TagsRequestRepresentation = {
      ObjectIds: [designation],
      Keys: keys
    }

    return this.getTagsInternal(tagsRequestRepresentation);
  }

  public getTagsInternal(tagsRequestRepresentation: TagsRequestRepresentation): Observable<TagsKeyValueInfo | undefined> {
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + tagsUrl;

    const body: any = JSON.stringify(tagsRequestRepresentation);

    return this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<TagsResponseRepresentation>) => {
        return this.getTagsKeyValueInfo(response.body);
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.graphics, 'getTags()', this.errorService)));
  }

  private getTagsKeyValueInfo(tagsResponseRepresentation: TagsResponseRepresentation | null): TagsKeyValueInfo | undefined {
    return tagsResponseRepresentation?.ObjectTagInfos?.[0]?.KeyValueInfo;
  }
}
