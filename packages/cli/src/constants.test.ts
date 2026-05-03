import { describe, expect, it } from "vitest";
import { getFriendlyUrl } from "./constants.js";

describe("getFriendlyUrl", () => {
  it("formats the named-host URL with the bound port", () => {
    expect(getFriendlyUrl(3417)).toBe("http://localterm.localhost:3417");
  });

  it("appends a path segment when provided", () => {
    expect(getFriendlyUrl(3417, "alpha-otter-2k4r")).toBe(
      "http://localterm.localhost:3417/alpha-otter-2k4r",
    );
  });

  it("percent-encodes path segments that contain URL-significant characters", () => {
    expect(getFriendlyUrl(3417, "weird?name#here")).toBe(
      "http://localterm.localhost:3417/weird%3Fname%23here",
    );
  });
});
