import { describe, expect, it } from "vite-plus/test";
import {
  TERMINAL_MSG_TYPE,
  decodeInput,
  decodeOutput,
  decodeResize,
  decodeTitle,
  encodeInput,
  encodeResize,
} from "../src/protocol.js";
import {
  XUMUX_CHANNEL_CONTROL,
  XUMUX_CTRL_CHANNEL_ACK,
  XUMUX_CTRL_CLOSE_CHANNEL,
  XUMUX_CTRL_HELLO,
  XUMUX_CTRL_OPEN_CHANNEL,
  XUMUX_CTRL_WELCOME,
  XUMUX_VERSION,
  decodeFrame,
  encodeFrame,
} from "../src/xumux/index.js";
import { XumuxServer } from "../src/xumux/xumux-server.js";
import type { XumuxTransport } from "../src/xumux/types.js";
import { Session } from "../src/session.js";
import { SessionRegistry } from "../src/session-registry.js";

const createMockTransport = () => {
  const sent: Uint8Array[] = [];
  const transport: XumuxTransport = {
    send: (data) => sent.push(new Uint8Array(data)),
    close: () => {},
    get bufferedAmount() {
      return 0;
    },
  };
  return { transport, sent };
};

const sendHello = (server: XumuxServer) => {
  server.onMessage(
    encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_HELLO, new Uint8Array([XUMUX_VERSION])),
  );
};

const sendOpenChannel = (server: XumuxServer, channelId: number) => {
  const payload = new Uint8Array(2);
  new DataView(payload.buffer).setUint16(0, channelId, false);
  server.onMessage(encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_OPEN_CHANNEL, payload));
};

const sendCloseChannel = (server: XumuxServer, channelId: number) => {
  const payload = new Uint8Array(2);
  new DataView(payload.buffer).setUint16(0, channelId, false);
  server.onMessage(encodeFrame(XUMUX_CHANNEL_CONTROL, XUMUX_CTRL_CLOSE_CHANNEL, payload));
};

const findFrame = (
  sent: Uint8Array[],
  predicate: (frame: { channelId: number; type: number; payload: Uint8Array }) => boolean,
) => {
  for (const raw of sent) {
    const frame = decodeFrame(raw);
    if (frame && predicate(frame)) return frame;
  }
  return null;
};

const waitFor = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);

describe("xumux integration (mock transport)", () => {
  it("completes HELLO/WELCOME handshake, OPEN_CHANNEL/ACK, receives SESSION_INFO", () => {
    const { transport, sent } = createMockTransport();
    const registry = new SessionRegistry();

    const server = new XumuxServer(transport, {
      onOpenChannel: (channelId) => {
        const session = new Session({ shell: "/bin/sh" });
        registry.register(channelId, session);

        const sessionInfoPayload = new TextEncoder().encode(
          JSON.stringify({
            shell: session.shell,
            shellName: session.shellBaseName,
            pid: session.pid,
            cwd: session.cwd,
          }),
        );
        server.sendToChannel(channelId, TERMINAL_MSG_TYPE.SESSION_INFO, sessionInfoPayload);
      },
      onCloseChannel: (channelId) => {
        const session = registry.getByChannelId(channelId);
        if (session) {
          registry.unregister(channelId);
          session.dispose();
        }
      },
    });

    sendHello(server);
    expect(server.isHandshakeComplete).toBe(true);

    const welcome = findFrame(sent, (f) => f.type === XUMUX_CTRL_WELCOME);
    expect(welcome).not.toBeNull();
    expect(welcome!.payload[0]).toBe(XUMUX_VERSION);

    const channelId = 1;
    sendOpenChannel(server, channelId);

    const ack = findFrame(sent, (f) => f.type === XUMUX_CTRL_CHANNEL_ACK);
    expect(ack).not.toBeNull();
    expect(registry.size()).toBe(1);

    const sessionInfoFrame = findFrame(
      sent,
      (f) => f.channelId === channelId && f.type === TERMINAL_MSG_TYPE.SESSION_INFO,
    );
    expect(sessionInfoFrame).not.toBeNull();
    const sessionInfo = JSON.parse(new TextDecoder().decode(sessionInfoFrame!.payload));
    expect(sessionInfo.shell).toBeTruthy();
    expect(sessionInfo.pid).toBeGreaterThan(0);

    registry.disposeAll();
  });

  it("wires input to session and output back to channel", async () => {
    const { transport, sent } = createMockTransport();
    const registry = new SessionRegistry();

    const server = new XumuxServer(transport, {
      onOpenChannel: (channelId) => {
        const session = new Session({ shell: "/bin/sh" });
        registry.register(channelId, session);
        session.on("output", (data) => {
          server.sendToChannel(channelId, TERMINAL_MSG_TYPE.OUTPUT, new TextEncoder().encode(data));
        });
      },
      onChannelMessage: (event) => {
        const session = registry.getByChannelId(event.channelId);
        if (!session) return;
        if (event.type === TERMINAL_MSG_TYPE.INPUT) {
          session.write(decodeInput(event.payload));
        }
      },
      onCloseChannel: (channelId) => {
        const session = registry.getByChannelId(channelId);
        if (session) {
          registry.unregister(channelId);
          session.dispose();
        }
      },
    });

    sendHello(server);
    sendOpenChannel(server, 1);

    await new Promise((resolve) => setTimeout(resolve, 300));
    sent.length = 0;

    server.onMessage(encodeFrame(1, TERMINAL_MSG_TYPE.INPUT, encodeInput("echo INTEG_TOKEN\n")));

    await waitFor(
      new Promise<void>((resolve) => {
        const check = () => {
          const outputFrames = sent
            .map((raw) => decodeFrame(raw))
            .filter((f) => f !== null && f.channelId === 1 && f.type === TERMINAL_MSG_TYPE.OUTPUT);
          const combined = outputFrames.map((f) => decodeOutput(f!.payload)).join("");
          if (combined.includes("INTEG_TOKEN")) {
            resolve();
            return;
          }
          setTimeout(check, 50);
        };
        check();
      }),
      5000,
    );

    registry.disposeAll();
  }, 10000);

  it("handles resize via RESIZE message type", () => {
    const { transport } = createMockTransport();
    const registry = new SessionRegistry();

    const server = new XumuxServer(transport, {
      onOpenChannel: (channelId) => {
        const session = new Session({ shell: "/bin/sh", cols: 80, rows: 24 });
        registry.register(channelId, session);
      },
      onChannelMessage: (event) => {
        const session = registry.getByChannelId(event.channelId);
        if (!session) return;
        if (event.type === TERMINAL_MSG_TYPE.RESIZE) {
          const { cols, rows } = decodeResize(event.payload);
          session.resize(cols, rows);
        }
      },
    });

    sendHello(server);
    sendOpenChannel(server, 1);
    server.onMessage(encodeFrame(1, TERMINAL_MSG_TYPE.RESIZE, encodeResize(100, 50)));
    const session = registry.getByChannelId(1)!;
    expect(session.cols).toBe(100);
    expect(session.rows).toBe(50);

    registry.disposeAll();
  });

  it("exit sends EXIT frame and CLOSE_CHANNEL", async () => {
    const { transport, sent } = createMockTransport();
    const registry = new SessionRegistry();

    const server = new XumuxServer(transport, {
      onOpenChannel: (channelId) => {
        const session = new Session({ shell: "/bin/sh" });
        registry.register(channelId, session);
        session.on("exit", (code) => {
          const exitPayload = new Uint8Array(4);
          new DataView(exitPayload.buffer).setInt32(0, code ?? -1, false);
          server.sendToChannel(channelId, TERMINAL_MSG_TYPE.EXIT, exitPayload);
          server.closeChannel(channelId);
          registry.unregister(channelId);
        });
      },
      onChannelMessage: (event) => {
        const session = registry.getByChannelId(event.channelId);
        if (!session) return;
        if (event.type === TERMINAL_MSG_TYPE.INPUT) {
          session.write(decodeInput(event.payload));
        }
      },
    });

    sendHello(server);
    sendOpenChannel(server, 1);
    await new Promise((resolve) => setTimeout(resolve, 200));

    server.onMessage(encodeFrame(1, TERMINAL_MSG_TYPE.INPUT, encodeInput("exit 0\n")));

    await waitFor(
      new Promise<void>((resolve) => {
        const check = () => {
          const exitFrame = findFrame(
            sent,
            (f) => f.channelId === 1 && f.type === TERMINAL_MSG_TYPE.EXIT,
          );
          if (exitFrame) {
            resolve();
            return;
          }
          setTimeout(check, 50);
        };
        check();
      }),
      5000,
    );

    const closeFrame = findFrame(
      sent,
      (f) => f.channelId === XUMUX_CHANNEL_CONTROL && f.type === XUMUX_CTRL_CLOSE_CHANNEL,
    );
    expect(closeFrame).not.toBeNull();
  }, 10000);

  it("CLOSE_CHANNEL from client disposes session", () => {
    const { transport } = createMockTransport();
    const registry = new SessionRegistry();

    const server = new XumuxServer(transport, {
      onOpenChannel: (channelId) => {
        const session = new Session({ shell: "/bin/sh" });
        registry.register(channelId, session);
      },
      onCloseChannel: (channelId) => {
        const session = registry.getByChannelId(channelId);
        if (session) {
          registry.unregister(channelId);
          session.dispose();
        }
      },
    });

    sendHello(server);
    sendOpenChannel(server, 1);
    expect(registry.size()).toBe(1);
    sendCloseChannel(server, 1);
    expect(registry.size()).toBe(0);
  });

  it("receives title updates on the channel", async () => {
    const { transport, sent } = createMockTransport();
    const registry = new SessionRegistry();

    const server = new XumuxServer(transport, {
      onOpenChannel: (channelId) => {
        const session = new Session({ shell: "/bin/sh" });
        registry.register(channelId, session);
        session.on("title", (title) => {
          server.sendToChannel(channelId, TERMINAL_MSG_TYPE.TITLE, new TextEncoder().encode(title));
        });
      },
      onCloseChannel: (channelId) => {
        const session = registry.getByChannelId(channelId);
        if (session) {
          registry.unregister(channelId);
          session.dispose();
        }
      },
    });

    sendHello(server);
    sendOpenChannel(server, 1);

    await waitFor(
      new Promise<void>((resolve) => {
        const check = () => {
          const titleFrame = findFrame(
            sent,
            (f) => f.channelId === 1 && f.type === TERMINAL_MSG_TYPE.TITLE,
          );
          if (titleFrame && decodeTitle(titleFrame.payload).length > 0) {
            resolve();
            return;
          }
          setTimeout(check, 50);
        };
        check();
      }),
      3000,
    );

    const titleFrame = findFrame(
      sent,
      (f) => f.channelId === 1 && f.type === TERMINAL_MSG_TYPE.TITLE,
    );
    expect(titleFrame).not.toBeNull();
    expect(decodeTitle(titleFrame!.payload).length).toBeGreaterThan(0);

    registry.disposeAll();
  }, 5000);
});
