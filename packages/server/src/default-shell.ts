import { accessSync, constants as fsConstants } from "node:fs";
import os from "node:os";
import { DEFAULT_SHELL_FALLBACK } from "./constants.js";

const isExecutable = (binaryPath: string): boolean => {
  try {
    accessSync(binaryPath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
};

export const getDefaultShell = (): string => {
  if (process.platform === "win32") {
    return process.env.COMSPEC ?? "cmd.exe";
  }
  // Priority order (matches VS Code, Hyper, and Warp):
  //   1. LOCALTERM_SHELL — explicit user override
  //   2. os.userInfo().shell — the user's persistent login shell from passwd / DSCL
  //   3. process.env.SHELL — only as a fallback; this leaks the parent process's
  //      shell (often zsh from launchd / a Cursor terminal) and is wrong when the
  //      user has changed their default with `chsh`
  //   4. DEFAULT_SHELL_FALLBACK
  const candidates: string[] = [];
  if (process.env.LOCALTERM_SHELL) candidates.push(process.env.LOCALTERM_SHELL);
  try {
    const userInfo = os.userInfo();
    if (userInfo.shell) candidates.push(userInfo.shell);
  } catch {
    /* os.userInfo throws on systems without /etc/passwd entry for the uid */
  }
  if (process.env.SHELL) candidates.push(process.env.SHELL);
  candidates.push(DEFAULT_SHELL_FALLBACK);
  for (const candidate of candidates) {
    if (isExecutable(candidate)) return candidate;
  }
  return DEFAULT_SHELL_FALLBACK;
};
