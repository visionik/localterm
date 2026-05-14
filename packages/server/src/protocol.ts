export {
  MAX_COLS,
  MAX_CONCURRENT_SESSIONS,
  MAX_INPUT_BYTES,
  MAX_OUTPUT_BYTES,
  MAX_ROWS,
  MAX_TITLE_LENGTH,
  WS_BACKPRESSURE_THRESHOLD_BYTES,
} from "./constants.js";
export { healthSchema } from "./schemas.js";
export type { ServerError, ServerErrorCode, ServerErrorKind } from "./errors.js";

export const TERMINAL_MSG_TYPE = {
  INPUT: 0x01,
  OUTPUT: 0x02,
  RESIZE: 0x03,
  EXIT: 0x04,
  TITLE: 0x05,
  SESSION_INFO: 0x06,
} as const;

export type TerminalMsgType = (typeof TERMINAL_MSG_TYPE)[keyof typeof TERMINAL_MSG_TYPE];

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// INT32_MIN (0x80000000) — impossible as a real exit code on POSIX (0-255) or Windows (0-4294967295).
const EXIT_CODE_NULL_SENTINEL = -2147483648;

export const encodeInput = (data: string): Uint8Array => textEncoder.encode(data);

export const decodeInput = (payload: Uint8Array): string => textDecoder.decode(payload);

export const encodeOutput = (data: string): Uint8Array => textEncoder.encode(data);

export const decodeOutput = (payload: Uint8Array): string => textDecoder.decode(payload);

export const encodeResize = (cols: number, rows: number): Uint8Array => {
  const buffer = new Uint8Array(4);
  const view = new DataView(buffer.buffer);
  view.setUint16(0, cols, false);
  view.setUint16(2, rows, false);
  return buffer;
};

export const decodeResize = (payload: Uint8Array): { cols: number; rows: number } | null => {
  if (payload.length < 4) return null;
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return { cols: view.getUint16(0, false), rows: view.getUint16(2, false) };
};

export const encodeExit = (code: number | null): Uint8Array => {
  const buffer = new Uint8Array(4);
  const view = new DataView(buffer.buffer);
  view.setInt32(0, code ?? EXIT_CODE_NULL_SENTINEL, false);
  return buffer;
};

export const decodeExit = (payload: Uint8Array): number | null => {
  if (payload.length < 4) throw new Error("exit payload must be 4 bytes");
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const raw = view.getInt32(0, false);
  return raw === EXIT_CODE_NULL_SENTINEL ? null : raw;
};

export const encodeTitle = (title: string): Uint8Array => textEncoder.encode(title);

export const decodeTitle = (payload: Uint8Array): string => textDecoder.decode(payload);

export interface SessionInfo {
  shell: string;
  shellName: string;
  pid: number;
  cwd: string;
}

export const encodeSessionInfo = (info: SessionInfo): Uint8Array =>
  textEncoder.encode(JSON.stringify(info));

export const decodeSessionInfo = (payload: Uint8Array): SessionInfo =>
  JSON.parse(textDecoder.decode(payload)) as SessionInfo;

export {
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
  XUMUX_FRAME_HEADER_BYTES,
  XUMUX_VERSION,
} from "./xumux/index.js";
export { decodeFrame, encodeFrame, WebSocketAdapter, XumuxServer } from "./xumux/index.js";
export type {
  WebSocketLike,
  XumuxChannelEvent,
  XumuxFrame,
  XumuxServerEvents,
  XumuxTransport,
} from "./xumux/index.js";
