import { HttpParameterCodec } from '@angular/common/http';

export class WsiQueryEncoder implements HttpParameterCodec {
  public encodeKey(k: string): string {
    return encodeURIComponent(k);
  }
  public encodeValue(v: string): string {
    return encodeURIComponent(v);
  }
  public decodeKey(v: string): string {
    return (v);
  }
  public decodeValue(v: string): string {
    return decodeURIComponent(v);
  }
}
