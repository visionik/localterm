import {
  DEFAULT_TERMINAL_LINE_HEIGHT,
  TERMINAL_LINE_HEIGHT_MAX,
  TERMINAL_LINE_HEIGHT_MIN,
  TERMINAL_LINE_HEIGHT_STEP,
} from "@/lib/constants";

// `Math.round(value * factor) / factor` is more float-precise than
// `Math.round(value / step) * step` when step is a clean decimal like 0.1
// (12 / 10 === 1.2 vs 12 * 0.1 === 1.2000000000000002).
const STEP_PRECISION_FACTOR = 1 / TERMINAL_LINE_HEIGHT_STEP;

const roundToStep = (value: number): number =>
  Math.round(value * STEP_PRECISION_FACTOR) / STEP_PRECISION_FACTOR;

export const clampTerminalLineHeight = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_TERMINAL_LINE_HEIGHT;
  const snapped = roundToStep(value);
  if (snapped < TERMINAL_LINE_HEIGHT_MIN) return TERMINAL_LINE_HEIGHT_MIN;
  if (snapped > TERMINAL_LINE_HEIGHT_MAX) return TERMINAL_LINE_HEIGHT_MAX;
  return snapped;
};
