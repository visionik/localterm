import { describe, expect, it } from "vite-plus/test";
import { computeScrollbarThumbGeometry } from "../../src/utils/compute-scrollbar-thumb-geometry";

const MIN_THUMB_HEIGHT_PX = 24;

describe("computeScrollbarThumbGeometry", () => {
  it("returns zero geometry when not scrollable", () => {
    expect(
      computeScrollbarThumbGeometry({
        trackHeightPx: 0,
        viewportY: 0,
        baseY: 0,
        rows: 0,
        minThumbHeightPx: MIN_THUMB_HEIGHT_PX,
      }),
    ).toEqual({ thumbTopPx: 0, thumbHeightPx: 0 });

    expect(
      computeScrollbarThumbGeometry({
        trackHeightPx: 800,
        viewportY: 0,
        baseY: 0,
        rows: 0,
        minThumbHeightPx: MIN_THUMB_HEIGHT_PX,
      }),
    ).toEqual({ thumbTopPx: 0, thumbHeightPx: 0 });
  });

  it("places the thumb at the top when viewportY is 0", () => {
    const geometry = computeScrollbarThumbGeometry({
      trackHeightPx: 800,
      viewportY: 0,
      baseY: 1000,
      rows: 40,
      minThumbHeightPx: MIN_THUMB_HEIGHT_PX,
    });
    expect(geometry.thumbTopPx).toBe(0);
    expect(geometry.thumbHeightPx).toBeGreaterThan(0);
  });

  it("places the thumb at the bottom when fully scrolled", () => {
    const trackHeightPx = 800;
    const baseY = 1000;
    const rows = 40;
    const geometry = computeScrollbarThumbGeometry({
      trackHeightPx,
      viewportY: baseY,
      baseY,
      rows,
      minThumbHeightPx: MIN_THUMB_HEIGHT_PX,
    });
    expect(geometry.thumbTopPx + geometry.thumbHeightPx).toBeCloseTo(trackHeightPx, 5);
  });

  it("scales thumb height proportionally to visible rows", () => {
    const geometry = computeScrollbarThumbGeometry({
      trackHeightPx: 1000,
      viewportY: 0,
      baseY: 900,
      rows: 100,
      minThumbHeightPx: 0,
    });
    expect(geometry.thumbHeightPx).toBeCloseTo(100, 5);
  });

  it("clamps thumb height to the configured minimum", () => {
    const geometry = computeScrollbarThumbGeometry({
      trackHeightPx: 1000,
      viewportY: 0,
      baseY: 100_000,
      rows: 32,
      minThumbHeightPx: MIN_THUMB_HEIGHT_PX,
    });
    expect(geometry.thumbHeightPx).toBe(MIN_THUMB_HEIGHT_PX);
  });

  it("never produces a thumb taller than the track even when the minimum exceeds it", () => {
    const trackHeightPx = 100;
    const geometry = computeScrollbarThumbGeometry({
      trackHeightPx,
      viewportY: 0,
      baseY: 0,
      rows: 100,
      minThumbHeightPx: 500,
    });
    expect(geometry.thumbHeightPx).toBeLessThanOrEqual(trackHeightPx);
    expect(geometry.thumbTopPx).toBe(0);
  });

  it("clamps scroll progress when viewportY drifts past baseY", () => {
    const geometry = computeScrollbarThumbGeometry({
      trackHeightPx: 800,
      viewportY: 5000,
      baseY: 1000,
      rows: 40,
      minThumbHeightPx: MIN_THUMB_HEIGHT_PX,
    });
    expect(geometry.thumbTopPx + geometry.thumbHeightPx).toBeCloseTo(800, 5);
  });

  it("returns zero geometry on non-finite track heights", () => {
    expect(
      computeScrollbarThumbGeometry({
        trackHeightPx: Number.NaN,
        viewportY: 0,
        baseY: 100,
        rows: 32,
        minThumbHeightPx: MIN_THUMB_HEIGHT_PX,
      }),
    ).toEqual({ thumbTopPx: 0, thumbHeightPx: 0 });
  });
});
