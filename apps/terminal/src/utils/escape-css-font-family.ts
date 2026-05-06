/**
 * Escape a font-family name for safe interpolation inside a double-quoted CSS
 * string. CSS string syntax requires `\` to be escaped as `\\` and the matching
 * quote (`"`) as `\"`. The order matters: escape backslashes first so we don't
 * double-escape the backslash we add for the quote.
 *
 * Most installed fonts have plain names, but Local Font Access can surface
 * user-installed fonts with unusual characters, and the manual-input fallback
 * accepts arbitrary strings — we can't trust either source.
 */
export const escapeCssFontFamily = (family: string): string =>
  family.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
