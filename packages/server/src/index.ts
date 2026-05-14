import path from "node:path";
import { serve, type ServerType } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  HTTP_STATUS_NOT_FOUND,
  MAX_CONCURRENT_SESSIONS,
  WS_BACKPRESSURE_THRESHOLD_BYTES,
  WS_CLOSE_POLICY_VIOLATION,
} from "./constants.js";
import { ServerErrorException, serverError } from "./errors.js";
import {
  TERMINAL_MSG_TYPE,
  decodeInput,
  decodeResize,
  encodeExit,
  encodeOutput,
  encodeSessionInfo,
  encodeTitle,
} from "./protocol.js";
import { enforceLoopback, isLoopbackHost, loopbackMiddleware } from "./security.js";
import { Session } from "./session.js";
import { SessionRegistry } from "./session-registry.js";
import { resolveStaticAsset } from "./static-resolver.js";
import { WebSocketAdapter } from "./xumux/websocket-adapter.js";
import { XumuxServer } from "./xumux/xumux-server.js";

export interface ServerOptions {
  port?: number;
  host?: string;
  staticRoot?: string | null;
}

export interface RunningServer {
  port: number;
  host: string;
  registry: SessionRegistry;
  stop: () => Promise<void>;
}

export const createServer = async (options: ServerOptions = {}): Promise<RunningServer> => {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;
  if (!isLoopbackHost(host)) {
    throw new ServerErrorException(serverError.nonLoopbackHost(host));
  }

  const staticRoot =
    typeof options.staticRoot === "string" ? path.resolve(options.staticRoot) : null;

  const registry = new SessionRegistry();
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  const api = new Hono();
  api.use("*", loopbackMiddleware);
  api.get("/health", (context) => context.json({ ok: true, sessions: registry.size() }));
  api.notFound((context) => context.json({ error: "not_found" }, HTTP_STATUS_NOT_FOUND));
  app.route("/api", api);

  app.get(
    "/xumux",
    upgradeWebSocket((context) => {
      const blocked = enforceLoopback(context);
      if (blocked) {
        return { onOpen: (_event, ws) => ws.close(WS_CLOSE_POLICY_VIOLATION, "forbidden") };
      }

      let xumux: XumuxServer | null = null;
      // Per-connection session map: channelId → session.
      // Channel IDs are only unique within a single xumux connection, so using
      // the global registry (keyed by channelId) would cause collisions when two
      // concurrent connections both open channel 1. This local map is scoped to
      // the current WebSocket connection closure.
      const connectionSessions = new Map<number, Session>();
      // Parallel map of channelId → global registry auto-ID for size tracking.
      const connectionRegistryIds = new Map<number, number>();

      return {
        onOpen(_event, ws) {
          const adapter = new WebSocketAdapter(ws);
          xumux = new XumuxServer(adapter, {
            onOpenChannel: (channelId) => {
              if (registry.size() >= MAX_CONCURRENT_SESSIONS) {
                xumux?.closeChannel(channelId);
                return;
              }
              const session = new Session({});
              const globalId = registry.registerAuto(session);
              connectionSessions.set(channelId, session);
              connectionRegistryIds.set(channelId, globalId);

              const sessionInfoPayload = encodeSessionInfo({
                shell: session.shell,
                shellName: session.shellBaseName,
                pid: session.pid,
                cwd: session.cwd,
              });
              xumux?.sendToChannel(channelId, TERMINAL_MSG_TYPE.SESSION_INFO, sessionInfoPayload);

              const cleanupChannel = (disposeSes: boolean) => {
                connectionSessions.delete(channelId);
                const gid = connectionRegistryIds.get(channelId);
                if (gid !== undefined) {
                  registry.unregister(gid);
                  connectionRegistryIds.delete(channelId);
                }
                if (disposeSes) session.dispose();
              };

              session.on("output", (data) => {
                if (adapter.bufferedAmount > WS_BACKPRESSURE_THRESHOLD_BYTES) {
                  xumux?.closeChannel(channelId);
                  cleanupChannel(true);
                  return;
                }
                xumux?.sendToChannel(channelId, TERMINAL_MSG_TYPE.OUTPUT, encodeOutput(data));
              });
              session.on("title", (title) => {
                xumux?.sendToChannel(channelId, TERMINAL_MSG_TYPE.TITLE, encodeTitle(title));
              });
              session.on("exit", (code) => {
                xumux?.sendToChannel(channelId, TERMINAL_MSG_TYPE.EXIT, encodeExit(code));
                xumux?.closeChannel(channelId);
                // dispose() must be called here: onCloseChannel won't fire for
                // server-initiated closes, so this is the only cleanup path.
                cleanupChannel(true);
              });
            },
            onCloseChannel: (channelId) => {
              const session = connectionSessions.get(channelId);
              if (!session) return;
              connectionSessions.delete(channelId);
              const gid = connectionRegistryIds.get(channelId);
              if (gid !== undefined) {
                registry.unregister(gid);
                connectionRegistryIds.delete(channelId);
              }
              session.dispose();
            },
            onChannelMessage: (event) => {
              const session = connectionSessions.get(event.channelId);
              if (!session) return;
              if (event.type === TERMINAL_MSG_TYPE.INPUT) {
                session.write(decodeInput(event.payload));
              } else if (event.type === TERMINAL_MSG_TYPE.RESIZE) {
                const dims = decodeResize(event.payload);
                if (dims) session.resize(dims.cols, dims.rows);
              }
            },
          });
        },
        onMessage(event) {
          if (!xumux) return;
          const raw = event.data;
          let bytes: Uint8Array;
          if (raw instanceof Uint8Array) {
            bytes = raw;
          } else if (raw instanceof ArrayBuffer) {
            bytes = new Uint8Array(raw);
          } else if (typeof raw === "string") {
            bytes = new TextEncoder().encode(raw);
          } else if (ArrayBuffer.isView(raw)) {
            bytes = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
          } else if (typeof Blob !== "undefined" && raw instanceof Blob) {
            void raw.arrayBuffer().then((buffer) => {
              xumux?.onMessage(new Uint8Array(buffer));
            });
            return;
          } else {
            return;
          }
          xumux.onMessage(bytes);
        },
        onClose() {
          if (!xumux) return;
          xumux.close();
          xumux = null;
          // Dispose any sessions that didn't get an explicit CLOSE_CHANNEL
          // (e.g. client disconnected mid-session).
          for (const [, session] of connectionSessions) session.dispose();
          for (const [, gid] of connectionRegistryIds) registry.unregister(gid);
          connectionSessions.clear();
          connectionRegistryIds.clear();
        },
        onError() {
          if (!xumux) return;
          xumux.close();
          xumux = null;
          for (const [, session] of connectionSessions) session.dispose();
          for (const [, gid] of connectionRegistryIds) registry.unregister(gid);
          connectionSessions.clear();
          connectionRegistryIds.clear();
        },
      };
    }),
  );

  if (staticRoot) {
    app.use("*", loopbackMiddleware);
    app.get("*", (context) => {
      const requestPath = context.req.path;
      if (requestPath.startsWith("/api/") || requestPath.startsWith("/xumux")) {
        return context.json({ error: "not_found" }, HTTP_STATUS_NOT_FOUND);
      }
      const asset = resolveStaticAsset(staticRoot, requestPath);
      if (!asset) return context.text("not found", HTTP_STATUS_NOT_FOUND);
      return new Response(new Uint8Array(asset.body), {
        status: asset.status,
        headers: { "content-type": asset.contentType },
      });
    });
  }

  let httpServer: ServerType | null = null;
  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => {
      reject(new ServerErrorException(serverError.listenFailed(host, port, error)));
    };
    const node = serve(
      {
        fetch: app.fetch,
        hostname: host,
        port,
      },
      () => {
        node.removeListener("error", handleError);
        resolve();
      },
    );
    node.once("error", handleError);
    httpServer = node;
  });
  if (!httpServer) {
    throw new ServerErrorException(
      serverError.listenFailed(
        host,
        port,
        new Error("hono serve() resolved without binding an http server"),
      ),
    );
  }
  injectWebSocket(httpServer);

  const stop = async () => {
    registry.disposeAll();
    if (!httpServer) return;
    const target = httpServer;
    const closeAllConnections = Reflect.get(target, "closeAllConnections");
    if (typeof closeAllConnections === "function") {
      closeAllConnections.call(target);
    }
    await new Promise<void>((resolve) => {
      target.close(() => resolve());
    });
  };

  return { port, host, registry, stop };
};

export type { Session } from "./session.js";
export type { SessionRegistry } from "./session-registry.js";
export type { SpawnPtyInput } from "./types.js";
export { DEFAULT_HOST, DEFAULT_PORT } from "./constants.js";
export { isLoopbackHost } from "./security.js";
export { healthSchema } from "./schemas.js";
export {
  ServerErrorException,
  formatServerError,
  isServerErrorException,
  serverError,
} from "./errors.js";
export type { ServerError, ServerErrorCode, ServerErrorKind } from "./errors.js";
