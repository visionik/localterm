import { claimTabHue } from "./claim-tab-hue";
import { resetFaviconStateStore } from "./favicon-state-store";
import { setTabFaviconState } from "./set-tab-favicon-state";

export const applyTabFavicon = (): void => {
  resetFaviconStateStore();
  setTabFaviconState("idle");
  claimTabHue();
};
