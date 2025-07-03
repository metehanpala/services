import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AuthenticationServiceBase,
  ErrorNotificationServiceBase,
  isNullOrUndefined,
  TraceService
} from '@gms-flex/services-common';
import { first, from, Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules, WsiUtilityService } from '../shared';
import { WsiEndpointService } from '../wsi-endpoint';
import { EncryptedPasswordResponse, PublicKeyResponse } from './password-encryption.model';

@Injectable({
  providedIn: 'root'
})
export class PasswordEncryptionService {
  private readonly getPublicKeyUrl = '/api/users/getpublicKey';

  public constructor(
    public readonly traceService: TraceService,
    public readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService) {
  }

  public getOneTimePublicKey(): Observable<PublicKeyResponse> {
    const url: string = this.wsiEndpointService.entryPoint + this.getPublicKeyUrl;
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.authentication, 'getOneTimePublicKey()'),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.authentication, 'getOneTimePublicKey()'))
      ));
  }

  public getMessageEncoding(password: string): Uint8Array {
    const textEncoder: TextEncoder = new TextEncoder();
    const encodedMessage: Uint8Array = textEncoder.encode(password);
    return encodedMessage;
  }

  public encryptMessage(cryptoKey: CryptoKey, password: string): Observable<ArrayBuffer> {
    const encoded = this.getMessageEncoding(password);
    const encryptPromise: Promise<any> = window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      cryptoKey,
      encoded
    );

    return from(encryptPromise);
  }

  // Update return type
  public getEncryptedPassword(password: string): Observable<EncryptedPasswordResponse> {
    const encryptedPasswordSubject: Subject<EncryptedPasswordResponse> = new Subject<EncryptedPasswordResponse>();

    this.getOneTimePublicKey().pipe(first()).subscribe({
      next: (publicKeyResponse: PublicKeyResponse) => {
        this.importRsaKey(publicKeyResponse.PublicKey).pipe(first()).subscribe({
          next: (cryptoKey: CryptoKey) => {
            this.encryptMessage(cryptoKey, password).pipe(first()).subscribe({
              next: (resultBuffer: ArrayBuffer) => {
                const encryptedPassword: string = window.btoa(this.ab2str(resultBuffer));
                const encryptedPasswordResponse: EncryptedPasswordResponse = new EncryptedPasswordResponse(publicKeyResponse.SessionKey, encryptedPassword);
                encryptedPasswordSubject.next(encryptedPasswordResponse);
              },
              error: (error: any) => {
                this.wsiUtilityService.handleError(error, TraceModules.authentication, 'getEncryptedPassword(): encryptMessage()');
              }
            });
          },
          error: (error: any) => {
            this.wsiUtilityService.handleError(error, TraceModules.authentication, 'getEncryptedPassword(): importRsaKey()');
          }
        });
      },
      error: (error: any) => {
        this.wsiUtilityService.handleError(error, TraceModules.authentication, 'getEncryptedPassword(): getOneTimePublicKey()');
      }
    });

    return encryptedPasswordSubject.asObservable();
  }

  public get isCryptoApiAvailable(): boolean {
    return !isNullOrUndefined(window?.crypto?.subtle?.encrypt);
  }

  private ab2str(buf: ArrayBuffer): string {
    return String.fromCharCode.apply(null, new Uint8Array(buf) as any);
  }

  private str2ab(str: string): ArrayBuffer {
    const buf: ArrayBuffer = new ArrayBuffer(str.length);
    const bufView: Uint8Array = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  private importRsaKey(pem: string): Observable<CryptoKey> {
    // fetch the part of the PEM string between header and footer
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = this.str2ab(binaryDerString);
    // const binaryDer = str2ab(pemContents);

    const importKeyPromise: Promise<CryptoKey> = window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']);
    return from(importKeyPromise);
  }
}
