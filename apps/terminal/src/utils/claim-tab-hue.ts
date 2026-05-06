import {
  FAVICON_BROADCAST_CHANNEL_NAME,
  FAVICON_COLLISION_RESOLVE_TIMEOUT_MS,
} from "@/lib/constants";
import { getCachedHue, pickFreshHueAvoiding, replaceHue } from "./favicon-state-store";
import { setTabFaviconState } from "./set-tab-favicon-state";

type FaviconBroadcastMessage =
  | { type: "ping"; tabId: string; hue: number }
  | { type: "claimed"; tabId: string; hue: number };

let broadcastChannel: BroadcastChannel | null = null;
let selfTabId: string | null = null;

const ensureBroadcastChannel = (): BroadcastChannel | null => {
  if (broadcastChannel) return broadcastChannel;
  if (typeof BroadcastChannel === "undefined") return null;
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") return null;

  selfTabId = crypto.randomUUID();
  broadcastChannel = new BroadcastChannel(FAVICON_BROADCAST_CHANNEL_NAME);
  broadcastChannel.addEventListener("message", (event: MessageEvent<FaviconBroadcastMessage>) => {
    const message = event.data;
    const ownHue = getCachedHue();
    if (
      message.type === "ping" &&
      message.tabId !== selfTabId &&
      message.hue === ownHue &&
      broadcastChannel &&
      selfTabId
    ) {
      broadcastChannel.postMessage({
        type: "claimed",
        tabId: selfTabId,
        hue: ownHue,
      } satisfies FaviconBroadcastMessage);
    }
  });
  return broadcastChannel;
};

/**
 * Browsers copy `sessionStorage` into duplicated tabs, which means the new tab
 * inherits the parent's favicon hue verbatim. Detect that by pinging peers with
 * our hue; if anyone responds with the same hue, regenerate locally.
 */
export const claimTabHue = (): void => {
  const channel = ensureBroadcastChannel();
  if (!channel || !selfTabId) return;

  const proposedHue = getCachedHue();
  const collidingHues = new Set<number>();

  const handleResponse = (event: MessageEvent<FaviconBroadcastMessage>) => {
    const message = event.data;
    if (message.type === "claimed" && message.tabId !== selfTabId && message.hue === proposedHue) {
      collidingHues.add(message.hue);
    }
  };

  channel.addEventListener("message", handleResponse);
  channel.postMessage({
    type: "ping",
    tabId: selfTabId,
    hue: proposedHue,
  } satisfies FaviconBroadcastMessage);

  setTimeout(() => {
    channel.removeEventListener("message", handleResponse);
    if (collidingHues.size === 0) return;
    const freshHue = pickFreshHueAvoiding([...collidingHues]);
    if (freshHue === proposedHue) return;
    replaceHue(freshHue);
    setTabFaviconState("idle");
  }, FAVICON_COLLISION_RESOLVE_TIMEOUT_MS);
};
