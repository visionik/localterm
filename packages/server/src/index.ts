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
  WS_CLOSE_BACKPRESSURE,
  WS_CLOSE_CAPACITY_REACHED,
  WS_CLOSE_POLICY_VIOLATION,
  WS_READY_STATE_OPEN,
} from "./constants.js";
import { ServerErrorException, serverError } from "./errors.js";
import { clientToServerMessageSchema } from "./schemas.js";
import { enforceLoopback, isLoopbackHost, loopbackMiddleware } from "./security.js";
import { Session } from "./session.js";
import { SessionRegistry } from "./session-registry.js";
import { resolveStaticAsset } from "./static-resolver.js";
import type { ServerToClientMessage } from "./types.js";

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

interface BroadcastSocket {
  readyState: number;
  send: (raw: string) => void;
  close: (code?: number, reason?: string) => void;
  raw?: unknown;
}

const getRawBufferedAmount = (raw: unknown): number => {
  if (!raw || typeof raw !== "object") return 0;
  const candidate = Reflect.get(raw, "bufferedAmount");
  return typeof candidate === "number" ? candidate : 0;
};

const safeSend = (ws: BroadcastSocket, payload: ServerToClientMessage) => {
  if (ws.readyState !== WS_READY_STATE_OPEN) return;
  if (getRawBufferedAmount(ws.raw) > WS_BACKPRESSURE_THRESHOLD_BYTES) {
    ws.close(WS_CLOSE_BACKPRESSURE, "backpressure");
    return;
  }
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    /* socket closed between readyState check and send */
  }
};

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
    "/ws",
    upgradeWebSocket((context) => {
      const blocked = enforceLoopback(context);
      if (blocked) {
        return { onOpen: (_event, ws) => ws.close(WS_CLOSE_POLICY_VIOLATION, "forbidden") };
      }

      let session: Session | null = null;

      return {
        onOpen(_event, ws) {
          if (registry.size() >= MAX_CONCURRENT_SESSIONS) {
            ws.close(WS_CLOSE_CAPACITY_REACHED, "session capacity reached");
            return;
          }
          session = new Session({});
          registry.register(session);

          // Wire listeners BEFORE the first safeSend so any synchronous emit
          // from Session (current or future) reaches the client. Today
          // node-pty's data/exit are async, but this guards against drift.
          const onOutput = (data: string) => safeSend(ws, { type: "output", data });
          const onTitle = (title: string) => safeSend(ws, { type: "title", title });
          const onExit = (code: number | null) => {
            safeSend(ws, { type: "exit", code });
            ws.close();
          };
          session.on("output", onOutput);
          session.on("title", onTitle);
          session.on("exit", onExit);

          safeSend(ws, {
            type: "session",
            shell: session.shell,
            shellName: session.shellBaseName,
            pid: session.pid,
            cwd: session.cwd,
          });
        },
        onMessage(event) {
          if (!session) return;
          let rawPayload: unknown;
          try {
            const raw = typeof event.data === "string" ? event.data : event.data.toString();
            rawPayload = JSON.parse(raw);
          } catch {
            return;
          }
          const parsed = clientToServerMessageSchema.safeParse(rawPayload);
          if (!parsed.success) return;
          if (parsed.data.type === "input") {
            session.write(parsed.data.data);
          } else {
            session.resize(parsed.data.cols, parsed.data.rows);
          }
        },
        onClose() {
          if (!session) return;
          registry.unregister(session);
          session.dispose();
          session = null;
        },
        onError() {
          if (!session) return;
          registry.unregister(session);
          session.dispose();
          session = null;
        },
      };
    }),
  );

  if (staticRoot) {
    app.use("*", loopbackMiddleware);
    app.get("*", (context) => {
      const requestPath = context.req.path;
      if (requestPath.startsWith("/api/") || requestPath.startsWith("/ws")) {
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
export type * from "./types.js";
export { DEFAULT_HOST, DEFAULT_PORT, WS_CLOSE_BACKPRESSURE } from "./constants.js";
export { isLoopbackHost } from "./security.js";
export { healthSchema } from "./schemas.js";
export {
  ServerErrorException,
  formatServerError,
  isServerErrorException,
  serverError,
} from "./errors.js";
export type { ServerError, ServerErrorCode, ServerErrorKind } from "./errors.js";
