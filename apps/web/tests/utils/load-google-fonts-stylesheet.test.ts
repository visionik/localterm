import { afterEach, describe, expect, it } from "vite-plus/test";
import { GOOGLE_FONTS_STYLESHEET_ID } from "../../src/lib/constants";
import { loadGoogleFontsStylesheet } from "../../src/utils/load-google-fonts-stylesheet";

const cleanupInjectedStylesheet = () => {
  document.getElementById(GOOGLE_FONTS_STYLESHEET_ID)?.remove();
};

describe("loadGoogleFontsStylesheet", () => {
  afterEach(cleanupInjectedStylesheet);

  it("injects a single Google Fonts <link> with the expected id and href", () => {
    loadGoogleFontsStylesheet();

    const injected = document.getElementById(GOOGLE_FONTS_STYLESHEET_ID);
    expect(injected).not.toBeNull();
    expect(injected?.tagName.toLowerCase()).toBe("link");
    expect(injected?.getAttribute("rel")).toBe("stylesheet");
    expect(injected?.getAttribute("href")).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/);
  });

  it("is idempotent across repeated calls (StrictMode-safe)", () => {
    loadGoogleFontsStylesheet();
    loadGoogleFontsStylesheet();
    loadGoogleFontsStylesheet();

    const matchingLinks = document.querySelectorAll(`link#${GOOGLE_FONTS_STYLESHEET_ID}`);
    expect(matchingLinks.length).toBe(1);
  });
});
