import {
  FAVICON_HUE_GRID_STEP_DEG,
  FAVICON_HUE_JITTER_RANGE_DEG,
  FAVICON_HUE_WHEEL_DEG,
  FAVICON_RECENT_HUES_LIMIT,
  FAVICON_RECENT_HUES_STORAGE_KEY,
  FAVICON_SESSION_HUE_STORAGE_KEY,
} from "@/lib/constants";

export type FaviconState = "idle" | "active" | "dead";

const safeReadLocal = (key: string): unknown => {
  try {
    const raw = window.localStorage?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const safeWriteLocal = (key: string, value: unknown): void => {
  try {
    window.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be disabled in private mode */
  }
};

const safeReadSession = (key: string): string | null => {
  try {
    return window.sessionStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const safeWriteSession = (key: string, value: string): void => {
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {
    /* storage may be disabled in private mode */
  }
};

const wrappedHueDistance = (firstHue: number, secondHue: number): number => {
  const direct = Math.abs(firstHue - secondHue);
  return Math.min(direct, FAVICON_HUE_WHEEL_DEG - direct);
};

/**
 * Pick a hue maximally distant from `recent`, then jitter so hues from
 * different tabs don't all land on the same coarse grid.
 */
const pickDistantHue = (recent: readonly number[]): number => {
  if (recent.length === 0) return Math.floor(Math.random() * FAVICON_HUE_WHEEL_DEG);

  let bestHue = 0;
  let bestMinDistance = -1;
  for (
    let candidate = 0;
    candidate < FAVICON_HUE_WHEEL_DEG;
    candidate += FAVICON_HUE_GRID_STEP_DEG
  ) {
    let minDistance = FAVICON_HUE_WHEEL_DEG;
    for (const used of recent) {
      const distance = wrappedHueDistance(candidate, used);
      if (distance < minDistance) minDistance = distance;
    }
    if (minDistance > bestMinDistance) {
      bestMinDistance = minDistance;
      bestHue = candidate;
    }
  }

  const jitter = Math.floor((Math.random() - 0.5) * FAVICON_HUE_JITTER_RANGE_DEG);
  return (bestHue + jitter + FAVICON_HUE_WHEEL_DEG) % FAVICON_HUE_WHEEL_DEG;
};

const readPersistedHue = (): number | null => {
  const stored = safeReadSession(FAVICON_SESSION_HUE_STORAGE_KEY);
  if (!stored) return null;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : null;
};

const readRecentHues = (): number[] => {
  const raw = safeReadLocal(FAVICON_RECENT_HUES_STORAGE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is number => typeof entry === "number" && Number.isFinite(entry),
  );
};

const persistTabHue = (hue: number, recent: readonly number[]): void => {
  safeWriteSession(FAVICON_SESSION_HUE_STORAGE_KEY, String(hue));
  safeWriteLocal(
    FAVICON_RECENT_HUES_STORAGE_KEY,
    [...recent, hue].slice(-FAVICON_RECENT_HUES_LIMIT),
  );
};

let cachedHue: number | null = null;
let currentState: FaviconState = "idle";
let lastPaintedHue: number | null = null;

export const getCachedHue = (): number => {
  if (cachedHue !== null) return cachedHue;
  const persisted = readPersistedHue();
  if (persisted !== null) {
    cachedHue = persisted;
    return persisted;
  }
  const recent = readRecentHues();
  const fresh = pickDistantHue(recent);
  persistTabHue(fresh, recent);
  cachedHue = fresh;
  return fresh;
};

export const pickFreshHueAvoiding = (extraAvoidedHues: readonly number[]): number => {
  const recent = readRecentHues();
  return pickDistantHue([...recent, ...extraAvoidedHues]);
};

export const replaceHue = (nextHue: number): void => {
  cachedHue = nextHue;
  const recent = readRecentHues();
  persistTabHue(nextHue, recent);
};

export const shouldRepaintFavicon = (nextState: FaviconState, nextHue: number): boolean =>
  lastPaintedHue === null || nextState !== currentState || nextHue !== lastPaintedHue;

export const markFaviconPainted = (nextState: FaviconState, nextHue: number): void => {
  currentState = nextState;
  lastPaintedHue = nextHue;
};

export const resetFaviconStateStore = (): void => {
  cachedHue = null;
  currentState = "idle";
  lastPaintedHue = null;
};
