import {
  DEFAULT_TERMINAL_FONT_SIZE_PX,
  TERMINAL_FONT_SIZE_MAX_PX,
  TERMINAL_FONT_SIZE_MIN_PX,
} from "@/lib/constants";

export const clampTerminalFontSize = (size: number): number => {
  if (!Number.isFinite(size)) return DEFAULT_TERMINAL_FONT_SIZE_PX;
  const rounded = Math.round(size);
  if (rounded < TERMINAL_FONT_SIZE_MIN_PX) return TERMINAL_FONT_SIZE_MIN_PX;
  if (rounded > TERMINAL_FONT_SIZE_MAX_PX) return TERMINAL_FONT_SIZE_MAX_PX;
  return rounded;
};
