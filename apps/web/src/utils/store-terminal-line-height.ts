import { TERMINAL_LINE_HEIGHT_STORAGE_KEY } from "@/lib/constants";

export const storeTerminalLineHeight = (lineHeight: number): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TERMINAL_LINE_HEIGHT_STORAGE_KEY, String(lineHeight));
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
