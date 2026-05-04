import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_TERMINAL_SCROLLBACK_LINES,
  TERMINAL_SCROLLBACK_PRESETS,
  isTerminalScrollbackValue,
} from "../../src/lib/terminal-scrollback";

describe("terminal-scrollback registry", () => {
  it("offers at least three presets sorted ascending by line count", () => {
    expect(TERMINAL_SCROLLBACK_PRESETS.length).toBeGreaterThanOrEqual(3);
    const sorted = [...TERMINAL_SCROLLBACK_PRESETS].sort((a, b) => a.value - b.value);
    expect(sorted).toEqual([...TERMINAL_SCROLLBACK_PRESETS]);
  });

  it("default scrollback is one of the presets", () => {
    expect(isTerminalScrollbackValue(DEFAULT_TERMINAL_SCROLLBACK_LINES)).toBe(true);
  });

  it("isTerminalScrollbackValue rejects values not in the preset list", () => {
    expect(isTerminalScrollbackValue(0)).toBe(false);
    expect(isTerminalScrollbackValue(123)).toBe(false);
    expect(isTerminalScrollbackValue(Number.NaN)).toBe(false);
    expect(isTerminalScrollbackValue(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
