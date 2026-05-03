export type DaemonProbeOutcome = "ready" | "died" | "timeout";

export interface DaemonProbeResult {
  outcome: DaemonProbeOutcome;
  port: number | null;
}

export interface DaemonProbeOptions {
  childPid: number;
  initialPort: number | null;
  intervalMs: number;
  maxWaitMs: number;
  isAlive: (pid: number) => boolean;
  readPort: () => number | null;
  sleep: (durationMs: number) => Promise<void>;
}

export const pollForDaemonReady = async (
  options: DaemonProbeOptions,
): Promise<DaemonProbeResult> => {
  let waited = 0;
  while (waited < options.maxWaitMs) {
    await options.sleep(options.intervalMs);
    waited += options.intervalMs;
    if (!options.isAlive(options.childPid)) return { outcome: "died", port: null };
    const observedPort = options.readPort();
    if (observedPort !== null && observedPort !== options.initialPort) {
      return { outcome: "ready", port: observedPort };
    }
  }
  return { outcome: "timeout", port: null };
};
