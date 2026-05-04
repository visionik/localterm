import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_TERMINAL_FONT_SIZE_PX,
  TERMINAL_FONT_SIZE_MAX_PX,
  TERMINAL_FONT_SIZE_MIN_PX,
} from "../../src/lib/constants";
import { clampTerminalFontSize } from "../../src/utils/clamp-terminal-font-size";

describe("clampTerminalFontSize", () => {
  it("returns the input unchanged when within range", () => {
    expect(clampTerminalFontSize(13)).toBe(13);
    expect(clampTerminalFontSize(TERMINAL_FONT_SIZE_MIN_PX)).toBe(TERMINAL_FONT_SIZE_MIN_PX);
    expect(clampTerminalFontSize(TERMINAL_FONT_SIZE_MAX_PX)).toBe(TERMINAL_FONT_SIZE_MAX_PX);
  });

  it("clamps below the minimum up to the minimum", () => {
    expect(clampTerminalFontSize(0)).toBe(TERMINAL_FONT_SIZE_MIN_PX);
    expect(clampTerminalFontSize(TERMINAL_FONT_SIZE_MIN_PX - 1)).toBe(TERMINAL_FONT_SIZE_MIN_PX);
    expect(clampTerminalFontSize(-100)).toBe(TERMINAL_FONT_SIZE_MIN_PX);
  });

  it("clamps above the maximum down to the maximum", () => {
    expect(clampTerminalFontSize(TERMINAL_FONT_SIZE_MAX_PX + 1)).toBe(TERMINAL_FONT_SIZE_MAX_PX);
    expect(clampTerminalFontSize(1000)).toBe(TERMINAL_FONT_SIZE_MAX_PX);
  });

  it("rounds fractional values to the nearest integer before clamping", () => {
    expect(clampTerminalFontSize(13.4)).toBe(13);
    expect(clampTerminalFontSize(13.6)).toBe(14);
  });

  it("falls back to the default when given a non-finite value", () => {
    expect(clampTerminalFontSize(Number.NaN)).toBe(DEFAULT_TERMINAL_FONT_SIZE_PX);
    expect(clampTerminalFontSize(Number.POSITIVE_INFINITY)).toBe(DEFAULT_TERMINAL_FONT_SIZE_PX);
    expect(clampTerminalFontSize(Number.NEGATIVE_INFINITY)).toBe(DEFAULT_TERMINAL_FONT_SIZE_PX);
  });
});
