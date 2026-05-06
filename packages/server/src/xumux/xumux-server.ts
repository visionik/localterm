import {
  XUMUX_CHANNEL_CONTROL,
  XUMUX_CHANNEL_MAX,
  XUMUX_CHANNEL_MIN,
  XUMUX_CTRL_CHANNEL_ACK,
  XUMUX_CTRL_CLOSE_CHANNEL,
  XUMUX_CTRL_HELLO,
  XUMUX_CTRL_OPEN_CHANNEL,
  XUMUX_CTRL_PING,
  XUMUX_CTRL_PONG,
  XUMUX_CTRL_WELCOME,
  XUMUX_VERSION,
} from "./constants.js";
import { decodeFrame, encodeFrame } from "./frame.js";
import type { XumuxServerEvents, XumuxTransport } from "./types.js";

export class XumuxServer {
  private readonly openChannels = new Set<number>();
  private handshakeComplete = false;

  constructor(
    private readonly transport: XumuxTransport,
    private readonly events: XumuxServerEvents,
  ) {}

  onMessage(data: Uint8Array): void {
    const frame = decodeFrame(data);
    if (!frame) {
      this.events.onError?.(new Error("malformed frame: too short"));
      return;
    }

    if (frame.channelId === XUMUX_CHANNEL_CONTROL) {
      this.handleControl(frame.type, frame.payload);
      return;
    }

    if (!this.handshakeComplete) {
      this.events.onError?.(new Error("data before handshake"));
      return;
    }

    if (!this.openChannels.has(frame.channelId)) {
      this.events.onError?.(new Error(`message on unknown channel ${frame.channelId}`));
      return;
    }

    this.events.onChannelMessage?.({
      channelId: frame.channelId,
      type: frame.type,
      payload: frame.payload,
    });
  }

  sendToChannel(channelId: number, type: number, payload: Uint8Array): void {
    if (!this.openChannels.has(channelId)) return;
    this.transport.send(encodeFrame(channelId, type, payload));
  }

  closeChannel(channelId: number): void {
    if (!this.openChannels.has(channelId)) return;
    this.openChannels.delete(channelId);
    const channelIdPayload = new Uint8Array(2);
    new DataView(channelIdPayload.buffer).setUint16(0, channelId, false);
    this.transport.send(encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_CLOSE_CHANNEL, channelIdPayload));
  }

  get activeChannelCount(): number {
    return this.openChannels.size;
  }

  get isHandshakeComplete(): boolean {
    return this.handshakeComplete;
  }

  close(): void {
    for (const channelId of this.openChannels) {
      this.events.onCloseChannel?.(channelId);
    }
    this.openChannels.clear();
    this.transport.close();
  }

  private handleControl(type: number, payload: Uint8Array): void {
    switch (type) {
      case XUMUX_CTRL_HELLO:
        this.handleHello(payload);
        break;
      case XUMUX_CTRL_OPEN_CHANNEL:
        this.handleOpenChannel(payload);
        break;
      case XUMUX_CTRL_CLOSE_CHANNEL:
        this.handleCloseChannel(payload);
        break;
      case XUMUX_CTRL_PING:
        this.transport.send(encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_PONG, new Uint8Array(0)));
        break;
      default:
        break;
    }
  }

  private handleHello(payload: Uint8Array): void {
    if (this.handshakeComplete) return;
    if (payload.length >= 1 && payload[0] !== XUMUX_VERSION) {
      this.events.onError?.(new Error(`unsupported xumux version: ${payload[0]}`));
      this.transport.close();
      return;
    }
    this.handshakeComplete = true;
    const welcomePayload = new Uint8Array([XUMUX_VERSION]);
    this.transport.send(encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_WELCOME, welcomePayload));
  }

  private handleOpenChannel(payload: Uint8Array): void {
    if (!this.handshakeComplete) return;
    if (payload.length < 2) return;
    const channelId = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint16(0, false);
    if (channelId < XUMUX_CHANNEL_MIN || channelId > XUMUX_CHANNEL_MAX) return;
    if (this.openChannels.has(channelId)) return;
    this.openChannels.add(channelId);
    const ackPayload = new Uint8Array(2);
    new DataView(ackPayload.buffer).setUint16(0, channelId, false);
    this.transport.send(encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_CHANNEL_ACK, ackPayload));
    this.events.onOpenChannel?.(channelId);
  }

  private handleCloseChannel(payload: Uint8Array): void {
    if (payload.length < 2) return;
    const channelId = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint16(0, false);
    if (!this.openChannels.has(channelId)) return;
    this.openChannels.delete(channelId);
    this.events.onCloseChannel?.(channelId);
  }
}
