import { TERMINAL_CURSOR_BLINK_STORAGE_KEY } from "@/lib/constants";

export const storeTerminalCursorBlink = (cursorBlink: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TERMINAL_CURSOR_BLINK_STORAGE_KEY, String(cursorBlink));
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
