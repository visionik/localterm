import "@/lib/local-fonts-types";

export const isLocalFontAccessSupported = (): boolean =>
  typeof window !== "undefined" && typeof window.queryLocalFonts === "function";

/**
 * Triggers the browser's permission prompt on the first call (must be invoked
 * from a user gesture). Subsequent calls are silent once permission is granted.
 * Returns an empty array on unsupported browsers, on rejection, or when no
 * fonts are accessible.
 */
export const queryLocalFonts = async (): Promise<readonly string[]> => {
  if (typeof window === "undefined") return [];
  const queryFn = window.queryLocalFonts;
  if (typeof queryFn !== "function") return [];
  try {
    const fonts = await queryFn();
    const uniqueFamilies = new Set<string>();
    for (const font of fonts) {
      if (font.family) uniqueFamilies.add(font.family);
    }
    return [...uniqueFamilies].sort((firstFamily, secondFamily) =>
      firstFamily.localeCompare(secondFamily, undefined, { sensitivity: "base" }),
    );
  } catch {
    return [];
  }
};
