import { describe, expect, it } from "vite-plus/test";
import { computeScrollbarDragTarget } from "../../src/utils/compute-scrollbar-drag-target";

describe("computeScrollbarDragTarget", () => {
  it("returns 0 when there is nothing to scroll", () => {
    expect(
      computeScrollbarDragTarget({
        pointerDeltaPx: 100,
        startViewportY: 0,
        trackHeightPx: 800,
        thumbHeightPx: 40,
        baseY: 0,
      }),
    ).toBe(0);
  });

  it("returns the start viewportY when the pointer has not moved", () => {
    expect(
      computeScrollbarDragTarget({
        pointerDeltaPx: 0,
        startViewportY: 250,
        trackHeightPx: 800,
        thumbHeightPx: 40,
        baseY: 1000,
      }),
    ).toBe(250);
  });

  it("maps pointer movement linearly across the usable track", () => {
    const trackHeightPx = 800;
    const thumbHeightPx = 40;
    const baseY = 1000;
    const fullSweepPx = trackHeightPx - thumbHeightPx;
    expect(
      computeScrollbarDragTarget({
        pointerDeltaPx: fullSweepPx,
        startViewportY: 0,
        trackHeightPx,
        thumbHeightPx,
        baseY,
      }),
    ).toBe(baseY);
    expect(
      computeScrollbarDragTarget({
        pointerDeltaPx: fullSweepPx / 2,
        startViewportY: 0,
        trackHeightPx,
        thumbHeightPx,
        baseY,
      }),
    ).toBe(Math.round(baseY / 2));
  });

  it("clamps to [0, baseY]", () => {
    const baseY = 500;
    expect(
      computeScrollbarDragTarget({
        pointerDeltaPx: -10_000,
        startViewportY: 100,
        trackHeightPx: 800,
        thumbHeightPx: 40,
        baseY,
      }),
    ).toBe(0);
    expect(
      computeScrollbarDragTarget({
        pointerDeltaPx: 10_000,
        startViewportY: 100,
        trackHeightPx: 800,
        thumbHeightPx: 40,
        baseY,
      }),
    ).toBe(baseY);
  });

  it("falls back to startViewportY when computation produces a non-finite value", () => {
    expect(
      computeScrollbarDragTarget({
        pointerDeltaPx: Number.NaN,
        startViewportY: 42,
        trackHeightPx: 800,
        thumbHeightPx: 40,
        baseY: 1000,
      }),
    ).toBe(42);
  });
});
