import { DEFAULT_TERMINAL_FONT_SIZE_PX, TERMINAL_FONT_SIZE_STORAGE_KEY } from "@/lib/constants";
import { clampTerminalFontSize } from "@/utils/clamp-terminal-font-size";

export const loadStoredTerminalFontSize = (): number => {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_FONT_SIZE_PX;
  try {
    const raw = window.localStorage.getItem(TERMINAL_FONT_SIZE_STORAGE_KEY);
    if (raw === null || raw === "") return DEFAULT_TERMINAL_FONT_SIZE_PX;
    return clampTerminalFontSize(Number(raw));
  } catch {
    return DEFAULT_TERMINAL_FONT_SIZE_PX;
  }
};
