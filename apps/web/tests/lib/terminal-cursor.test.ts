import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_TERMINAL_CURSOR_STYLE,
  TERMINAL_CURSOR_STYLES,
  isTerminalCursorStyle,
} from "../../src/lib/terminal-cursor";

describe("terminal-cursor registry", () => {
  it("ships block, bar, and underline styles", () => {
    const ids = TERMINAL_CURSOR_STYLES.map((option) => option.id).sort();
    expect(ids).toEqual(["bar", "block", "underline"]);
  });

  it("default cursor style is one of the registered styles", () => {
    expect(isTerminalCursorStyle(DEFAULT_TERMINAL_CURSOR_STYLE)).toBe(true);
  });

  it("isTerminalCursorStyle accepts known ids and rejects everything else", () => {
    expect(isTerminalCursorStyle("block")).toBe(true);
    expect(isTerminalCursorStyle("bar")).toBe(true);
    expect(isTerminalCursorStyle("underline")).toBe(true);
    expect(isTerminalCursorStyle("hover")).toBe(false);
    expect(isTerminalCursorStyle(null)).toBe(false);
    expect(isTerminalCursorStyle(undefined)).toBe(false);
    expect(isTerminalCursorStyle(42)).toBe(false);
  });
});
