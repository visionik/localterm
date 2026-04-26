import { describe, expect, it } from "vitest";
import { lastPathSegment } from "./last-path-segment";

describe("lastPathSegment", () => {
  it("returns the last segment of a regular path", () => {
    expect(lastPathSegment("/Users/aidenybai/code")).toBe("code");
  });

  it("strips trailing slashes", () => {
    expect(lastPathSegment("/Users/aidenybai/code/")).toBe("code");
    expect(lastPathSegment("/Users/aidenybai/code///")).toBe("code");
  });

  it("returns the directory itself for a single-segment path", () => {
    expect(lastPathSegment("/tmp")).toBe("tmp");
  });

  it("returns / for the root", () => {
    expect(lastPathSegment("/")).toBe("/");
  });

  it("returns empty for empty input", () => {
    expect(lastPathSegment("")).toBe("");
  });

  it("handles paths without a leading slash", () => {
    expect(lastPathSegment("relative/path/here")).toBe("here");
  });
});
