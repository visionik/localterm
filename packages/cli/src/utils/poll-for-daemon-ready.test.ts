import { describe, expect, it, vi } from "vitest";
import { pollForDaemonReady } from "./poll-for-daemon-ready.js";

const STANDARD_OPTIONS = {
  childPid: 12345,
  intervalMs: 10,
  maxWaitMs: 100,
};

const noopSleep = (): Promise<void> => Promise.resolve();

describe("pollForDaemonReady", () => {
  it("returns ready with the new port once a different value appears", async () => {
    let tick = 0;
    const result = await pollForDaemonReady({
      ...STANDARD_OPTIONS,
      initialPort: null,
      isAlive: () => true,
      readPort: () => {
        tick += 1;
        return tick < 3 ? null : 4242;
      },
      sleep: noopSleep,
    });
    expect(result).toEqual({ outcome: "ready", port: 4242 });
  });

  it("rejects a stale port that matches initialPort and keeps polling", async () => {
    const stalePort = 3417;
    const newPort = 5555;
    let tick = 0;
    const result = await pollForDaemonReady({
      ...STANDARD_OPTIONS,
      initialPort: stalePort,
      isAlive: () => true,
      readPort: () => {
        tick += 1;
        if (tick < 4) return stalePort;
        return newPort;
      },
      sleep: noopSleep,
    });
    expect(result).toEqual({ outcome: "ready", port: newPort });
  });

  it("returns died when the child process disappears mid-poll", async () => {
    let tick = 0;
    const result = await pollForDaemonReady({
      ...STANDARD_OPTIONS,
      initialPort: null,
      isAlive: () => {
        tick += 1;
        return tick < 3;
      },
      readPort: () => null,
      sleep: noopSleep,
    });
    expect(result).toEqual({ outcome: "died", port: null });
  });

  it("returns timeout when the deadline expires without a fresh port", async () => {
    const result = await pollForDaemonReady({
      ...STANDARD_OPTIONS,
      initialPort: null,
      isAlive: () => true,
      readPort: () => null,
      sleep: noopSleep,
    });
    expect(result).toEqual({ outcome: "timeout", port: null });
  });

  it("returns ready immediately on the first tick when a fresh port is already present", async () => {
    const isAlive = vi.fn(() => true);
    const readPort = vi.fn(() => 7777);
    const result = await pollForDaemonReady({
      ...STANDARD_OPTIONS,
      initialPort: null,
      isAlive,
      readPort,
      sleep: noopSleep,
    });
    expect(result).toEqual({ outcome: "ready", port: 7777 });
    expect(isAlive).toHaveBeenCalledOnce();
    expect(readPort).toHaveBeenCalledOnce();
  });

  it("polls roughly maxWaitMs / intervalMs times before timing out", async () => {
    const sleepSpy = vi.fn(noopSleep);
    await pollForDaemonReady({
      childPid: 1,
      initialPort: null,
      intervalMs: 10,
      maxWaitMs: 100,
      isAlive: () => true,
      readPort: () => null,
      sleep: sleepSpy,
    });
    expect(sleepSpy).toHaveBeenCalledTimes(10);
  });
});
