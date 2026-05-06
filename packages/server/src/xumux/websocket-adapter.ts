import type { XumuxTransport } from "./types.js";

export interface WebSocketLike {
  send(data: ArrayBufferLike | Uint8Array | string, options?: unknown): void;
  close(code?: number, reason?: string): void;
  readonly readyState: number;
  raw?: unknown;
}

const getRawBufferedAmount = (socket: WebSocketLike): number => {
  const raw = socket.raw;
  if (!raw || typeof raw !== "object") return 0;
  const candidate = Reflect.get(raw, "bufferedAmount");
  return typeof candidate === "number" ? candidate : 0;
};

export class WebSocketAdapter implements XumuxTransport {
  constructor(private readonly socket: WebSocketLike) {}

  send(data: Uint8Array): void {
    if (this.socket.readyState !== 1) return;
    this.socket.send(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  }

  close(): void {
    this.socket.close();
  }

  get bufferedAmount(): number {
    return getRawBufferedAmount(this.socket);
  }
}
