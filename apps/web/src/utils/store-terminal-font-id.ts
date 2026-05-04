import { TERMINAL_FONT_STORAGE_KEY } from "@/lib/constants";

export const storeTerminalFontId = (fontId: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TERMINAL_FONT_STORAGE_KEY, fontId);
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
