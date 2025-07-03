import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ModeService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModeInterceptor implements HttpInterceptor {

  constructor(private readonly modeService: ModeService) {
    //
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (this.modeService.getCurrentModeValue() != null &&
        this.modeService.getCurrentModeValue().id === 'investigative' &&
        this.modeService.getCurrentModeValue().relatedValue != null) {

      // Clone the request and replace the original headers with
      // cloned headers, updated with the AlertId.

      const propertyIdTripleEncoded: string = encodeURIComponent((this.modeService.getCurrentModeValue().relatedValue));
      const modeReq: HttpRequest<any> = req.clone({
        headers: req.headers.set('AlertId', propertyIdTripleEncoded)
      });

      // send cloned request with header to the next handler.
      return next.handle(modeReq);
    }

    return next.handle(req);
  }
}
