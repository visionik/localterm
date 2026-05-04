import { GOOGLE_FONTS_STYLESHEET_ID } from "@/lib/constants";
import { buildGoogleFontsStylesheetHref } from "@/lib/terminal-fonts";

export const loadGoogleFontsStylesheet = (): void => {
  if (typeof document === "undefined") return;
  if (document.getElementById(GOOGLE_FONTS_STYLESHEET_ID)) return;
  const href = buildGoogleFontsStylesheetHref();
  if (!href) return;
  const link = document.createElement("link");
  link.id = GOOGLE_FONTS_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};
