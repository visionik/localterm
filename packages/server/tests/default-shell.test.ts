import os from "node:os";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { getDefaultShell } from "../src/default-shell.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getDefaultShell (Unix)", () => {
  it("LOCALTERM_SHELL wins over every other source when it points to an executable", () => {
    if (process.platform === "win32") return;
    vi.stubEnv("LOCALTERM_SHELL", "/bin/sh");
    vi.stubEnv("SHELL", "/bin/zsh");
    vi.spyOn(os, "userInfo").mockReturnValue({
      uid: 0,
      gid: 0,
      username: "tester",
      homedir: "/Users/tester",
      shell: "/opt/homebrew/bin/fish",
    } as ReturnType<typeof os.userInfo>);

    expect(getDefaultShell()).toBe("/bin/sh");
  });

  it("falls back to os.userInfo().shell over process.env.SHELL (login shell beats current shell)", () => {
    if (process.platform === "win32") return;
    vi.stubEnv("LOCALTERM_SHELL", "");
    vi.stubEnv("SHELL", "/bin/zsh");
    // Pretend the login shell is /bin/sh — guaranteed executable on every Unix.
    vi.spyOn(os, "userInfo").mockReturnValue({
      uid: 0,
      gid: 0,
      username: "tester",
      homedir: "/Users/tester",
      shell: "/bin/sh",
    } as ReturnType<typeof os.userInfo>);

    expect(getDefaultShell()).toBe("/bin/sh");
  });

  it("falls back to process.env.SHELL when os.userInfo().shell is unset", () => {
    if (process.platform === "win32") return;
    vi.stubEnv("LOCALTERM_SHELL", "");
    vi.stubEnv("SHELL", "/bin/sh");
    vi.spyOn(os, "userInfo").mockReturnValue({
      uid: 0,
      gid: 0,
      username: "tester",
      homedir: "/Users/tester",
      shell: "",
    } as ReturnType<typeof os.userInfo>);

    expect(getDefaultShell()).toBe("/bin/sh");
  });

  it("ultimately falls back to /bin/sh when nothing else is executable", () => {
    if (process.platform === "win32") return;
    vi.stubEnv("LOCALTERM_SHELL", "/definitely/does/not/exist");
    vi.stubEnv("SHELL", "/also/missing");
    vi.spyOn(os, "userInfo").mockReturnValue({
      uid: 0,
      gid: 0,
      username: "tester",
      homedir: "/Users/tester",
      shell: "/missing/too",
    } as ReturnType<typeof os.userInfo>);

    expect(getDefaultShell()).toBe("/bin/sh");
  });

  it("does not throw when os.userInfo throws (uid not in passwd)", () => {
    if (process.platform === "win32") return;
    vi.stubEnv("LOCALTERM_SHELL", "");
    vi.stubEnv("SHELL", "/bin/sh");
    vi.spyOn(os, "userInfo").mockImplementation(() => {
      throw new Error("getpwuid failed");
    });

    expect(() => getDefaultShell()).not.toThrow();
    expect(getDefaultShell()).toBe("/bin/sh");
  });
});
