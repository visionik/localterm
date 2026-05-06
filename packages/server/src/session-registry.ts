import type { Session } from "./session.js";

export class SessionRegistry {
  private readonly sessions = new Map<number, Session>();
  private nextAutoId = -1;

  register(channelId: number, session: Session): void {
    this.sessions.set(channelId, session);
  }

  registerAuto(session: Session): number {
    const autoId = this.nextAutoId;
    this.nextAutoId -= 1;
    this.sessions.set(autoId, session);
    return autoId;
  }

  unregister(channelId: number): void {
    this.sessions.delete(channelId);
  }

  getByChannelId(channelId: number): Session | undefined {
    return this.sessions.get(channelId);
  }

  size(): number {
    return this.sessions.size;
  }

  disposeAll(): void {
    for (const session of this.sessions.values()) {
      session.dispose();
    }
    this.sessions.clear();
  }
}
