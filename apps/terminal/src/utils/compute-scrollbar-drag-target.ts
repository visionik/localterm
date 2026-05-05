interface ScrollbarDragTargetInput {
  pointerDeltaPx: number;
  startViewportY: number;
  trackHeightPx: number;
  thumbHeightPx: number;
  baseY: number;
}

export const computeScrollbarDragTarget = (input: ScrollbarDragTargetInput): number => {
  const { pointerDeltaPx, startViewportY, trackHeightPx, thumbHeightPx, baseY } = input;
  if (baseY <= 0) return 0;
  const usableTrackPx = Math.max(trackHeightPx - thumbHeightPx, 1);
  const linesPerPixel = baseY / usableTrackPx;
  const desiredViewportY = startViewportY + pointerDeltaPx * linesPerPixel;
  if (!Number.isFinite(desiredViewportY)) return startViewportY;
  return Math.max(0, Math.min(baseY, Math.round(desiredViewportY)));
};
