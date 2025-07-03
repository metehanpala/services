import { Subject } from 'rxjs';

export class SubscribeContextChannelized<T> {
  private static ctxCounter = 0;
  private readonly replies: Map<string, T> = new Map<string, T>();
  private readonly _ctxId: string;

  constructor(public requestedIds: string[], public postSubject: Subject<T[]>) {
    this._ctxId = SubscribeContextChannelized.ctxCounter.toString();
    SubscribeContextChannelized.ctxCounter++;
  }

  public get id(): string {
    return this._ctxId;
  }

  public setReply(id: string, subWsi: T): void {
    this.replies.set(id, subWsi);
  }

  public checkAllRepliesDone(): boolean {
    return (this.requestedIds.length === this.replies.size) ? true : false;
  }

  public getAllSubscriptions(): T[] {
    return Array.from(this.replies.values());
  }
}
