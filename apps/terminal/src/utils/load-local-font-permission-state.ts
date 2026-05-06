export type LocalFontPermissionState = "granted" | "denied" | "prompt" | "unsupported";

/**
 * Reads the current `local-fonts` permission without triggering a prompt.
 * `unsupported` covers both Firefox/Safari (no Permissions API entry for
 * `local-fonts`) and the case where `navigator.permissions` itself is missing.
 */
export const loadLocalFontPermissionState = async (): Promise<LocalFontPermissionState> => {
  if (typeof navigator === "undefined" || !navigator.permissions) return "unsupported";
  try {
    const status = await navigator.permissions.query({
      name: "local-fonts" as PermissionName,
    });
    return status.state;
  } catch {
    return "unsupported";
  }
};
