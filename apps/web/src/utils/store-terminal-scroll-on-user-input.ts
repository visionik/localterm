import { TERMINAL_SCROLL_ON_USER_INPUT_STORAGE_KEY } from "@/lib/constants";

export const storeTerminalScrollOnUserInput = (scrollOnUserInput: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TERMINAL_SCROLL_ON_USER_INPUT_STORAGE_KEY,
      String(scrollOnUserInput),
    );
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
