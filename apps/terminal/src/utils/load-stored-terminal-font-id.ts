import { LOCAL_FONT_ID, TERMINAL_FONT_STORAGE_KEY } from "@/lib/constants";
import { DEFAULT_TERMINAL_FONT_ID, findTerminalFontById } from "@/lib/terminal-fonts";
import { loadStoredLocalFontFamily } from "./load-stored-local-font-family";

export const loadStoredTerminalFontId = (): string => {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_FONT_ID;
  try {
    const stored = window.localStorage.getItem(TERMINAL_FONT_STORAGE_KEY);
    if (stored === LOCAL_FONT_ID) {
      return loadStoredLocalFontFamily() ? LOCAL_FONT_ID : DEFAULT_TERMINAL_FONT_ID;
    }
    return findTerminalFontById(stored).id;
  } catch {
    return DEFAULT_TERMINAL_FONT_ID;
  }
};
