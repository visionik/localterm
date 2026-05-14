import {
  WS_BACKPRESSURE_THRESHOLD_BYTES,
  WS_CLOSE_POLICY_VIOLATION,
} from "./constants.js";

interface NonLoopbackHostError {
  kind: "non-loopback-host";
  code: "E_LT_SERVER_NON_LOOPBACK_HOST";
  host: string;
}

interface ListenFailedError {
  kind: "listen-failed";
  code: "E_LT_SERVER_LISTEN_FAILED";
  host: string;
  port: number;
  cause: Error;
}

interface LoopbackDeniedError {
  kind: "loopback-denied";
  code: "E_LT_SERVER_LOOPBACK_DENIED";
  reason: "host" | "origin";
  observed: string | null;
  wsCloseCode: typeof WS_CLOSE_POLICY_VIOLATION;
}

interface BackpressureError {
  kind: "backpressure";
  code: "E_LT_SERVER_BACKPRESSURE";
  bufferedBytes: number;
  thresholdBytes: typeof WS_BACKPRESSURE_THRESHOLD_BYTES;
}

interface SessionCapacityError {
  kind: "session-capacity";
  code: "E_LT_SERVER_SESSION_CAPACITY";
  limit: number;
}

interface FrameRejectedError {
  kind: "frame-rejected";
  code: "E_LT_SERVER_FRAME_REJECTED";
  direction: "inbound" | "outbound";
  reason: string;
}

interface PathTraversalError {
  kind: "path-traversal";
  code: "E_LT_SERVER_PATH_TRAVERSAL";
  requested: string;
}

export type ServerError =
  | NonLoopbackHostError
  | ListenFailedError
  | LoopbackDeniedError
  | BackpressureError
  | SessionCapacityError
  | FrameRejectedError
  | PathTraversalError;

export type ServerErrorCode = ServerError["code"];
export type ServerErrorKind = ServerError["kind"];

export const serverError = {
  nonLoopbackHost: (host: string): NonLoopbackHostError => ({
    kind: "non-loopback-host",
    code: "E_LT_SERVER_NON_LOOPBACK_HOST",
    host,
  }),
  listenFailed: (host: string, port: number, cause: Error): ListenFailedError => ({
    kind: "listen-failed",
    code: "E_LT_SERVER_LISTEN_FAILED",
    host,
    port,
    cause,
  }),
  loopbackDenied: (reason: "host" | "origin", observed: string | null): LoopbackDeniedError => ({
    kind: "loopback-denied",
    code: "E_LT_SERVER_LOOPBACK_DENIED",
    reason,
    observed,
    wsCloseCode: WS_CLOSE_POLICY_VIOLATION,
  }),
  backpressure: (bufferedBytes: number): BackpressureError => ({
    kind: "backpressure",
    code: "E_LT_SERVER_BACKPRESSURE",
    bufferedBytes,
    thresholdBytes: WS_BACKPRESSURE_THRESHOLD_BYTES,
  }),
  sessionCapacity: (limit: number): SessionCapacityError => ({
    kind: "session-capacity",
    code: "E_LT_SERVER_SESSION_CAPACITY",
    limit,
  }),
  frameRejected: (direction: "inbound" | "outbound", reason: string): FrameRejectedError => ({
    kind: "frame-rejected",
    code: "E_LT_SERVER_FRAME_REJECTED",
    direction,
    reason,
  }),
  pathTraversal: (requested: string): PathTraversalError => ({
    kind: "path-traversal",
    code: "E_LT_SERVER_PATH_TRAVERSAL",
    requested,
  }),
};

const exhaustivenessGuard = (impossible: never): never => {
  throw new Error(`unhandled ServerError variant: ${JSON.stringify(impossible)}`);
};

export const formatServerError = (error: ServerError): string => {
  switch (error.kind) {
    case "non-loopback-host":
      return `refusing to bind non-loopback host '${error.host}': pass 127.0.0.1 or localhost`;
    case "listen-failed":
      return `failed to listen on ${error.host}:${error.port}: ${error.cause.message}`;
    case "loopback-denied": {
      const where = error.reason === "host" ? "Host header" : "Origin header";
      const seen = error.observed ? ` (saw '${error.observed}')` : "";
      return `forbidden: non-loopback ${where}${seen}`;
    }
    case "backpressure":
      return `closing socket: outbound buffered ${error.bufferedBytes}B exceeds ${error.thresholdBytes}B threshold`;
    case "session-capacity":
      return `refusing new session: at capacity (${error.limit} concurrent sessions)`;
    case "frame-rejected":
      return `dropping malformed ${error.direction} frame: ${error.reason}`;
    case "path-traversal":
      return `refusing path-traversal request: '${error.requested}'`;
    default:
      return exhaustivenessGuard(error);
  }
};

export class ServerErrorException extends Error {
  readonly error: ServerError;
  constructor(error: ServerError) {
    super(formatServerError(error), {
      cause: "cause" in error ? error.cause : undefined,
    });
    this.name = "ServerErrorException";
    this.error = error;
  }
}

export const isServerErrorException = (value: unknown): value is ServerErrorException =>
  value instanceof ServerErrorException;
