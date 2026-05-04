import { TERMINAL_CURSOR_STYLE_STORAGE_KEY } from "@/lib/constants";
import type { TerminalCursorStyle } from "@/lib/terminal-cursor";

export const storeTerminalCursorStyle = (cursorStyle: TerminalCursorStyle): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TERMINAL_CURSOR_STYLE_STORAGE_KEY, cursorStyle);
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
