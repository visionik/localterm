import { buildFaviconSvg } from "./build-favicon-svg";
import {
  type FaviconState,
  getCachedHue,
  markFaviconPainted,
  shouldRepaintFavicon,
} from "./favicon-state-store";

export const setTabFaviconState = (state: FaviconState): void => {
  if (typeof document === "undefined") return;
  const hue = getCachedHue();
  if (!shouldRepaintFavicon(state, hue)) return;
  markFaviconPainted(state, hue);
  const href = `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg(hue, state))}`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = href;
};
