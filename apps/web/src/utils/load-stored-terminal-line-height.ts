import { DEFAULT_TERMINAL_LINE_HEIGHT, TERMINAL_LINE_HEIGHT_STORAGE_KEY } from "@/lib/constants";
import { clampTerminalLineHeight } from "@/utils/clamp-terminal-line-height";

export const loadStoredTerminalLineHeight = (): number => {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_LINE_HEIGHT;
  try {
    const raw = window.localStorage.getItem(TERMINAL_LINE_HEIGHT_STORAGE_KEY);
    if (raw === null || raw === "") return DEFAULT_TERMINAL_LINE_HEIGHT;
    return clampTerminalLineHeight(Number(raw));
  } catch {
    return DEFAULT_TERMINAL_LINE_HEIGHT;
  }
};
