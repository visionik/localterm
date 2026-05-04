import { FONT_LOAD_PROBE_PX } from "@/lib/constants";
import type { TerminalFont } from "@/lib/terminal-fonts";

export const awaitFontReady = async (font: TerminalFont): Promise<void> => {
  if (typeof document === "undefined") return;
  if (!font.name) return;
  try {
    await Promise.all([
      document.fonts.load(`${FONT_LOAD_PROBE_PX}px "${font.name}"`),
      document.fonts.load(`bold ${FONT_LOAD_PROBE_PX}px "${font.name}"`),
    ]);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[localterm] failed to load font "${font.name}":`, error);
    }
  }
};
