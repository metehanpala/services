export class ClientIdentification {

  private static counter = 0;
  private readonly _clientId: string;

  public constructor(
    clientName: string) {
    if (clientName !== undefined) {
      this._clientId = clientName + ':' + ClientIdentification.counter.toString();
    } else {
      this._clientId = 'Default' + ':' + ClientIdentification.counter.toString();
    }
    ClientIdentification.counter++;
  }

  public get clientId(): string {
    return this._clientId;
  }
}
