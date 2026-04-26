import { spawn } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { resolveCwdForPid } from "./cwd-resolver.js";

let tempDir: string;
let canonicalTempDir: string;

beforeAll(() => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), "localterm-cwd-"));
  canonicalTempDir = realpathSync(tempDir);
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveCwdForPid", () => {
  it("returns null for non-finite pids", async () => {
    expect(await resolveCwdForPid(Number.NaN)).toBeNull();
    expect(await resolveCwdForPid(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("returns null for non-positive pids", async () => {
    expect(await resolveCwdForPid(0)).toBeNull();
    expect(await resolveCwdForPid(-1)).toBeNull();
  });

  it("resolves the cwd of a long-lived child process", async () => {
    const child = spawn("/bin/sh", ["-c", "sleep 1.5"], { cwd: tempDir });
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const resolved = await resolveCwdForPid(child.pid ?? 0);
      expect(resolved).not.toBeNull();
      if (resolved) expect(realpathSync(resolved)).toBe(canonicalTempDir);
    } finally {
      child.kill("SIGKILL");
    }
  });

  it("returns null when the pid does not exist", async () => {
    const result = await resolveCwdForPid(999_999_999);
    expect(result).toBeNull();
  });

  it("returns null when the pid belongs to a process that just exited", async () => {
    const child = spawn("/bin/sh", ["-c", "exit 0"], { cwd: tempDir });
    const pid = child.pid ?? 0;
    await new Promise((resolve) => child.once("exit", resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const result = await resolveCwdForPid(pid);
    expect(result).toBeNull();
  });
});
