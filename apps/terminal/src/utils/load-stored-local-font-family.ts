import { LOCAL_FONT_FAMILY_STORAGE_KEY } from "@/lib/constants";

export const loadStoredLocalFontFamily = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(LOCAL_FONT_FAMILY_STORAGE_KEY);
    return stored && stored.trim() ? stored : null;
  } catch {
    return null;
  }
};
