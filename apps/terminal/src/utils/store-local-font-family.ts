import { LOCAL_FONT_FAMILY_STORAGE_KEY } from "@/lib/constants";

export const storeLocalFontFamily = (family: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_FONT_FAMILY_STORAGE_KEY, family);
  } catch {
    /* localStorage unavailable; selection still applies in-session */
  }
};
