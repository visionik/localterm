import { describe, expect, it, vi } from "vite-plus/test";
import {
  XUMUX_CHANNEL_CONTROL,
  XUMUX_CTRL_CHANNEL_ACK,
  XUMUX_CTRL_CLOSE_CHANNEL,
  XUMUX_CTRL_HELLO,
  XUMUX_CTRL_OPEN_CHANNEL,
  XUMUX_CTRL_PING,
  XUMUX_CTRL_PONG,
  XUMUX_CTRL_WELCOME,
  XUMUX_VERSION,
  decodeFrame,
  encodeFrame,
} from "../src/xumux/index.js";
import { XumuxServer } from "../src/xumux/xumux-server.js";
import type { XumuxTransport } from "../src/xumux/types.js";
import { WebSocketAdapter } from "../src/xumux/websocket-adapter.js";

const createMockTransport = () => {
  const sent: Uint8Array[] = [];
  let closed = false;
  const transport: XumuxTransport = {
    send: (data) => sent.push(data),
    close: () => {
      closed = true;
    },
    get bufferedAmount() {
      return 0;
    },
  };
  return { transport, sent, isClosed: () => closed };
};

const makeHello = (): Uint8Array =>
  encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_HELLO, new Uint8Array([XUMUX_VERSION]));

const makeOpenChannel = (channelId: number): Uint8Array => {
  const payload = new Uint8Array(2);
  new DataView(payload.buffer).setUint16(0, channelId, false);
  return encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_OPEN_CHANNEL, payload);
};

const makeCloseChannel = (channelId: number): Uint8Array => {
  const payload = new Uint8Array(2);
  new DataView(payload.buffer).setUint16(0, channelId, false);
  return encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_CLOSE_CHANNEL, payload);
};

describe("encodeFrame / decodeFrame", () => {
  it("round-trips a frame", () => {
    const payload = new Uint8Array([0xde, 0xad]);
    const encoded = encodeFrame(0x0001, 0x02, payload);
    const decoded = decodeFrame(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.channelId).toBe(1);
    expect(decoded!.type).toBe(2);
    expect(decoded!.payload).toEqual(new Uint8Array([0xde, 0xad]));
  });

  it("round-trips an empty payload", () => {
    const encoded = encodeFrame(0, 0x01, new Uint8Array(0));
    const decoded = decodeFrame(encoded);
    expect(decoded!.payload.length).toBe(0);
  });

  it("returns null for data shorter than header", () => {
    expect(decodeFrame(new Uint8Array(2))).toBeNull();
    expect(decodeFrame(new Uint8Array(0))).toBeNull();
  });
});

describe("XumuxServer", () => {
  it("completes HELLO/WELCOME handshake", () => {
    const { transport, sent } = createMockTransport();
    const server = new XumuxServer(transport, {});
    expect(server.isHandshakeComplete).toBe(false);
    server.onMessage(makeHello());
    expect(server.isHandshakeComplete).toBe(true);

    const welcomeFrame = decodeFrame(sent[0]);
    expect(welcomeFrame!.channelId).toBe(XUMUX_CHANNEL_CONTROL);
    expect(welcomeFrame!.type).toBe(XUMUX_CTRL_WELCOME);
    expect(welcomeFrame!.payload[0]).toBe(XUMUX_VERSION);
  });

  it("handles OPEN_CHANNEL with CHANNEL_ACK", () => {
    const { transport, sent } = createMockTransport();
    const onOpenChannel = vi.fn();
    const server = new XumuxServer(transport, { onOpenChannel });
    server.onMessage(makeHello());
    server.onMessage(makeOpenChannel(1));

    expect(onOpenChannel).toHaveBeenCalledWith(1);
    const ackFrame = decodeFrame(sent[1]);
    expect(ackFrame!.type).toBe(XUMUX_CTRL_CHANNEL_ACK);
    const ackChannelId = new DataView(
      ackFrame!.payload.buffer,
      ackFrame!.payload.byteOffset,
    ).getUint16(0, false);
    expect(ackChannelId).toBe(1);
  });

  it("handles CLOSE_CHANNEL", () => {
    const { transport } = createMockTransport();
    const onCloseChannel = vi.fn();
    const server = new XumuxServer(transport, { onOpenChannel: vi.fn(), onCloseChannel });
    server.onMessage(makeHello());
    server.onMessage(makeOpenChannel(1));
    server.onMessage(makeCloseChannel(1));
    expect(onCloseChannel).toHaveBeenCalledWith(1);
  });

  it("dispatches channel messages after handshake", () => {
    const { transport } = createMockTransport();
    const onChannelMessage = vi.fn();
    const server = new XumuxServer(transport, { onOpenChannel: vi.fn(), onChannelMessage });
    server.onMessage(makeHello());
    server.onMessage(makeOpenChannel(5));

    const dataPayload = new Uint8Array([0x01, 0x02, 0x03]);
    server.onMessage(encodeFrame(5, 0x01, dataPayload));
    expect(onChannelMessage).toHaveBeenCalledWith({
      channelId: 5,
      type: 0x01,
      payload: expect.any(Uint8Array),
    });
  });

  it("errors on data before handshake", () => {
    const { transport } = createMockTransport();
    const onError = vi.fn();
    const server = new XumuxServer(transport, { onError });
    server.onMessage(encodeFrame(1, 0x01, new Uint8Array(0)));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "data before handshake" }));
  });

  it("errors on message to unknown channel", () => {
    const { transport } = createMockTransport();
    const onError = vi.fn();
    const server = new XumuxServer(transport, { onError });
    server.onMessage(makeHello());
    server.onMessage(encodeFrame(99, 0x01, new Uint8Array(0)));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "message on unknown channel 99" }),
    );
  });

  it("responds to PING with PONG", () => {
    const { transport, sent } = createMockTransport();
    const server = new XumuxServer(transport, {});
    server.onMessage(makeHello());
    const pingFrame = encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_PING, new Uint8Array(0));
    server.onMessage(pingFrame);
    const pongFrame = decodeFrame(sent[sent.length - 1]);
    expect(pongFrame!.type).toBe(XUMUX_CTRL_PONG);
  });

  it("sendToChannel sends data on open channels", () => {
    const { transport, sent } = createMockTransport();
    const server = new XumuxServer(transport, { onOpenChannel: vi.fn() });
    server.onMessage(makeHello());
    server.onMessage(makeOpenChannel(3));
    const payload = new Uint8Array([0xaa, 0xbb]);
    server.sendToChannel(3, 0x02, payload);
    const dataFrame = decodeFrame(sent[sent.length - 1]);
    expect(dataFrame!.channelId).toBe(3);
    expect(dataFrame!.type).toBe(0x02);
  });

  it("closeChannel sends CLOSE_CHANNEL and removes channel", () => {
    const { transport, sent } = createMockTransport();
    const server = new XumuxServer(transport, { onOpenChannel: vi.fn() });
    server.onMessage(makeHello());
    server.onMessage(makeOpenChannel(2));
    server.closeChannel(2);
    const closeFrame = decodeFrame(sent[sent.length - 1]);
    expect(closeFrame!.type).toBe(XUMUX_CTRL_CLOSE_CHANNEL);
    expect(server.activeChannelCount).toBe(0);
  });

  it("close() fires onCloseChannel for all open channels", () => {
    const { transport } = createMockTransport();
    const onCloseChannel = vi.fn();
    const server = new XumuxServer(transport, { onOpenChannel: vi.fn(), onCloseChannel });
    server.onMessage(makeHello());
    server.onMessage(makeOpenChannel(1));
    server.onMessage(makeOpenChannel(2));
    server.close();
    expect(onCloseChannel).toHaveBeenCalledTimes(2);
  });
});

describe("WebSocketAdapter", () => {
  it("sends binary data when socket is open", () => {
    const mockSocket = { send: vi.fn(), close: vi.fn(), readyState: 1 };
    const adapter = new WebSocketAdapter(mockSocket);
    const data = new Uint8Array([1, 2, 3]);
    adapter.send(data);
    expect(mockSocket.send).toHaveBeenCalledTimes(1);
  });

  it("does not send when socket is not open", () => {
    const mockSocket = { send: vi.fn(), close: vi.fn(), readyState: 3 };
    const adapter = new WebSocketAdapter(mockSocket);
    adapter.send(new Uint8Array([1]));
    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it("delegates close to the socket", () => {
    const mockSocket = { send: vi.fn(), close: vi.fn(), readyState: 1 };
    const adapter = new WebSocketAdapter(mockSocket);
    adapter.close();
    expect(mockSocket.close).toHaveBeenCalled();
  });

  it("reads bufferedAmount from raw property", () => {
    const mockSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1,
      raw: { bufferedAmount: 42 },
    };
    const adapter = new WebSocketAdapter(mockSocket);
    expect(adapter.bufferedAmount).toBe(42);
  });

  it("returns 0 when raw is missing", () => {
    const mockSocket = { send: vi.fn(), close: vi.fn(), readyState: 1 };
    const adapter = new WebSocketAdapter(mockSocket);
    expect(adapter.bufferedAmount).toBe(0);
  });
});
