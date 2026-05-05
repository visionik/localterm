interface ScrollbarThumbGeometryInput {
  trackHeightPx: number;
  viewportY: number;
  baseY: number;
  rows: number;
  minThumbHeightPx: number;
}

interface ScrollbarThumbGeometry {
  thumbTopPx: number;
  thumbHeightPx: number;
}

const clamp = (value: number, lower: number, upper: number): number =>
  Math.min(Math.max(value, lower), upper);

export const computeScrollbarThumbGeometry = (
  input: ScrollbarThumbGeometryInput,
): ScrollbarThumbGeometry => {
  const { trackHeightPx, viewportY, baseY, rows, minThumbHeightPx } = input;
  const totalLines = baseY + rows;
  if (!Number.isFinite(trackHeightPx) || trackHeightPx <= 0 || rows <= 0 || totalLines <= 0) {
    return { thumbTopPx: 0, thumbHeightPx: 0 };
  }
  const naturalThumbHeightPx = (rows / totalLines) * trackHeightPx;
  const thumbHeightPx = clamp(Math.max(minThumbHeightPx, naturalThumbHeightPx), 0, trackHeightPx);
  const usableTrackPx = Math.max(trackHeightPx - thumbHeightPx, 0);
  const scrollProgress = baseY <= 0 ? 0 : clamp(viewportY / baseY, 0, 1);
  const thumbTopPx = usableTrackPx * scrollProgress;
  return { thumbTopPx, thumbHeightPx };
};
