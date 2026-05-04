import { TERMINAL_FONT_SIZE_STORAGE_KEY } from "@/lib/constants";

export const storeTerminalFontSize = (size: number): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TERMINAL_FONT_SIZE_STORAGE_KEY, String(size));
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
