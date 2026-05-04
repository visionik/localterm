import { DEFAULT_TERMINAL_CURSOR_BLINK, TERMINAL_CURSOR_BLINK_STORAGE_KEY } from "@/lib/constants";

export const loadStoredTerminalCursorBlink = (): boolean => {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_CURSOR_BLINK;
  try {
    const raw = window.localStorage.getItem(TERMINAL_CURSOR_BLINK_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return DEFAULT_TERMINAL_CURSOR_BLINK;
  } catch {
    return DEFAULT_TERMINAL_CURSOR_BLINK;
  }
};
