import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_TERMINAL_FONT_ID,
  TERMINAL_FONTS,
  buildGoogleFontsStylesheetHref,
  findTerminalFontById,
} from "../../src/lib/terminal-fonts";

describe("terminal-fonts registry", () => {
  it("ships with several distinct monospace fonts", () => {
    expect(TERMINAL_FONTS.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(TERMINAL_FONTS.map((font) => font.id));
    expect(ids.size).toBe(TERMINAL_FONTS.length);
  });

  it("exposes the default font id and it resolves to a real font", () => {
    const font = findTerminalFontById(DEFAULT_TERMINAL_FONT_ID);
    expect(font.id).toBe(DEFAULT_TERMINAL_FONT_ID);
  });

  it("falls back to the default font for null, undefined, or unknown ids", () => {
    expect(findTerminalFontById(null).id).toBe(DEFAULT_TERMINAL_FONT_ID);
    expect(findTerminalFontById(undefined).id).toBe(DEFAULT_TERMINAL_FONT_ID);
    expect(findTerminalFontById("not-a-real-font").id).toBe(DEFAULT_TERMINAL_FONT_ID);
  });

  it.each(TERMINAL_FONTS.map((font) => [font.id, font] as const))(
    "%s declares a CSS family with monospace fallback",
    (_id, font) => {
      expect(font.family.length).toBeGreaterThan(0);
      expect(font.family).toContain("monospace");
    },
  );

  it("builds a single Google Fonts stylesheet URL containing every google-sourced family", () => {
    const href = buildGoogleFontsStylesheetHref();
    expect(href.startsWith("https://fonts.googleapis.com/css2?")).toBe(true);
    const googleFonts = TERMINAL_FONTS.filter((font) => font.source === "google");
    for (const font of googleFonts) {
      expect(href).toContain(font.name.replace(/ /g, "+"));
    }
  });
});
