/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { ModeInterceptor } from './mode-interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders: any[] = [
  { provide: HTTP_INTERCEPTORS, useClass: ModeInterceptor, multi: true }
];
