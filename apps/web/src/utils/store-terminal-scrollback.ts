import { TERMINAL_SCROLLBACK_STORAGE_KEY } from "@/lib/constants";

export const storeTerminalScrollback = (scrollback: number): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TERMINAL_SCROLLBACK_STORAGE_KEY, String(scrollback));
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
