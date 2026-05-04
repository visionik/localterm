import { TERMINAL_CURSOR_STYLE_STORAGE_KEY } from "@/lib/constants";
import {
  DEFAULT_TERMINAL_CURSOR_STYLE,
  isTerminalCursorStyle,
  type TerminalCursorStyle,
} from "@/lib/terminal-cursor";

export const loadStoredTerminalCursorStyle = (): TerminalCursorStyle => {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_CURSOR_STYLE;
  try {
    const raw = window.localStorage.getItem(TERMINAL_CURSOR_STYLE_STORAGE_KEY);
    if (isTerminalCursorStyle(raw)) return raw;
    return DEFAULT_TERMINAL_CURSOR_STYLE;
  } catch {
    return DEFAULT_TERMINAL_CURSOR_STYLE;
  }
};
