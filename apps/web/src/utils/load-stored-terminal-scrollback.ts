import { TERMINAL_SCROLLBACK_STORAGE_KEY } from "@/lib/constants";
import {
  DEFAULT_TERMINAL_SCROLLBACK_LINES,
  isTerminalScrollbackValue,
} from "@/lib/terminal-scrollback";

export const loadStoredTerminalScrollback = (): number => {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_SCROLLBACK_LINES;
  try {
    const raw = window.localStorage.getItem(TERMINAL_SCROLLBACK_STORAGE_KEY);
    if (raw === null || raw === "") return DEFAULT_TERMINAL_SCROLLBACK_LINES;
    const parsed = Number(raw);
    if (isTerminalScrollbackValue(parsed)) return parsed;
    return DEFAULT_TERMINAL_SCROLLBACK_LINES;
  } catch {
    return DEFAULT_TERMINAL_SCROLLBACK_LINES;
  }
};
