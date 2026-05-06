import { describe, expect, it } from "vite-plus/test";
import { escapeCssFontFamily } from "../../src/utils/escape-css-font-family";

describe("escapeCssFontFamily", () => {
  it("returns plain family names unchanged", () => {
    expect(escapeCssFontFamily("Iosevka")).toBe("Iosevka");
    expect(escapeCssFontFamily("JetBrainsMono Nerd Font")).toBe("JetBrainsMono Nerd Font");
  });

  it("escapes embedded double quotes so the CSS string stays balanced", () => {
    expect(escapeCssFontFamily('Custom "Pro" Mono')).toBe('Custom \\"Pro\\" Mono');
  });

  it("escapes backslashes before quotes so the quote escape isn't undone", () => {
    expect(escapeCssFontFamily("path\\with\\slashes")).toBe("path\\\\with\\\\slashes");
    expect(escapeCssFontFamily('weird\\"name')).toBe('weird\\\\\\"name');
  });
});
