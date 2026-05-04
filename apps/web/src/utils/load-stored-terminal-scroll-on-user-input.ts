import {
  DEFAULT_TERMINAL_SCROLL_ON_USER_INPUT,
  TERMINAL_SCROLL_ON_USER_INPUT_STORAGE_KEY,
} from "@/lib/constants";

export const loadStoredTerminalScrollOnUserInput = (): boolean => {
  if (typeof window === "undefined") return DEFAULT_TERMINAL_SCROLL_ON_USER_INPUT;
  try {
    const raw = window.localStorage.getItem(TERMINAL_SCROLL_ON_USER_INPUT_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return DEFAULT_TERMINAL_SCROLL_ON_USER_INPUT;
  } catch {
    return DEFAULT_TERMINAL_SCROLL_ON_USER_INPUT;
  }
};
