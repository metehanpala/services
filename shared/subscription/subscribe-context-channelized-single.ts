import { Subject } from 'rxjs';

export class SubscribeContextChannelizedSingle<T> {
  private static ctxCounter = 0;
  private reply: T | undefined = undefined!;
  private readonly _ctxId: string;

  constructor(public postSubject: Subject<T>) {
    this._ctxId = SubscribeContextChannelizedSingle.ctxCounter.toString();
    SubscribeContextChannelizedSingle.ctxCounter++;
  }

  public get id(): string {
    return this._ctxId;
  }

  public setReply(subWsi: T): void {
    this.reply = subWsi;
  }

  public checkAllRepliesDone(): boolean {
    return (this.reply != undefined);
  }

  public getAllSubscriptions(): T[] {
    return this.reply != undefined ? [this.reply] : [];
  }
}
