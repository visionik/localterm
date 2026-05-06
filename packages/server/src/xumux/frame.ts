import { XUMUX_FRAME_HEADER_BYTES } from "./constants.js";

export interface XumuxFrame {
  channelId: number;
  type: number;
  payload: Uint8Array;
}

export const encodeFrame = (channelId: number, type: number, payload: Uint8Array): Uint8Array => {
  const frame = new Uint8Array(XUMUX_FRAME_HEADER_BYTES + payload.length);
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  view.setUint16(0, channelId, false);
  frame[2] = type;
  frame.set(payload, XUMUX_FRAME_HEADER_BYTES);
  return frame;
};

export const decodeFrame = (data: Uint8Array): XumuxFrame | null => {
  if (data.length < XUMUX_FRAME_HEADER_BYTES) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const channelId = view.getUint16(0, false);
  const type = data[2];
  const payload = data.subarray(XUMUX_FRAME_HEADER_BYTES);
  return { channelId, type, payload };
};
