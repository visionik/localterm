import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_TERMINAL_LINE_HEIGHT,
  TERMINAL_LINE_HEIGHT_MAX,
  TERMINAL_LINE_HEIGHT_MIN,
  TERMINAL_LINE_HEIGHT_STEP,
} from "../../src/lib/constants";
import { clampTerminalLineHeight } from "../../src/utils/clamp-terminal-line-height";

describe("clampTerminalLineHeight", () => {
  it("returns the input unchanged when within range and on a step", () => {
    expect(clampTerminalLineHeight(DEFAULT_TERMINAL_LINE_HEIGHT)).toBe(
      DEFAULT_TERMINAL_LINE_HEIGHT,
    );
    expect(clampTerminalLineHeight(TERMINAL_LINE_HEIGHT_MIN)).toBe(TERMINAL_LINE_HEIGHT_MIN);
    expect(clampTerminalLineHeight(TERMINAL_LINE_HEIGHT_MAX)).toBe(TERMINAL_LINE_HEIGHT_MAX);
  });

  it("snaps fractional values to the nearest step", () => {
    expect(clampTerminalLineHeight(1.23)).toBeCloseTo(1.2, 5);
    expect(clampTerminalLineHeight(1.27)).toBeCloseTo(1.3, 5);
  });

  it("clamps below the minimum up to the minimum", () => {
    expect(clampTerminalLineHeight(TERMINAL_LINE_HEIGHT_MIN - TERMINAL_LINE_HEIGHT_STEP)).toBe(
      TERMINAL_LINE_HEIGHT_MIN,
    );
    expect(clampTerminalLineHeight(0)).toBe(TERMINAL_LINE_HEIGHT_MIN);
    expect(clampTerminalLineHeight(-100)).toBe(TERMINAL_LINE_HEIGHT_MIN);
  });

  it("clamps above the maximum down to the maximum", () => {
    expect(clampTerminalLineHeight(TERMINAL_LINE_HEIGHT_MAX + TERMINAL_LINE_HEIGHT_STEP)).toBe(
      TERMINAL_LINE_HEIGHT_MAX,
    );
    expect(clampTerminalLineHeight(99)).toBe(TERMINAL_LINE_HEIGHT_MAX);
  });

  it("falls back to the default when given a non-finite value", () => {
    expect(clampTerminalLineHeight(Number.NaN)).toBe(DEFAULT_TERMINAL_LINE_HEIGHT);
    expect(clampTerminalLineHeight(Number.POSITIVE_INFINITY)).toBe(DEFAULT_TERMINAL_LINE_HEIGHT);
    expect(clampTerminalLineHeight(Number.NEGATIVE_INFINITY)).toBe(DEFAULT_TERMINAL_LINE_HEIGHT);
  });
});
