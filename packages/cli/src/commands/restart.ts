import { spawn } from "node:child_process";
import { openSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import kleur from "kleur";
import { RESTART_PROBE_INTERVAL_MS, RESTART_PROBE_MAX_WAIT_MS } from "../constants.js";
import { ensureLogFile, isAlive, readPort } from "../state.js";
import { pollForDaemonReady } from "../utils/poll-for-daemon-ready.js";
import { sleep } from "../utils/sleep.js";
import { runStop } from "./stop.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const cliEntry = path.resolve(moduleDir, "../index.js");

export interface RestartOptions {
  port: number;
  host: string;
  open: boolean;
}

export const runRestart = async (options: RestartOptions): Promise<void> => {
  await runStop();
  const portBeforeSpawn = readPort();
  const logPath = ensureLogFile();
  const logFd = openSync(logPath, "a");
  const args = [cliEntry, "start", "--port", String(options.port), "--host", options.host];
  if (!options.open) args.push("--no-open");
  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: process.env,
  });
  child.unref();

  const childPid = child.pid;
  if (childPid === undefined) {
    console.log(kleur.red(`✗ failed to spawn child process. tail logs: ${logPath}`));
    process.exit(1);
  }

  const result = await pollForDaemonReady({
    childPid,
    initialPort: portBeforeSpawn,
    intervalMs: RESTART_PROBE_INTERVAL_MS,
    maxWaitMs: RESTART_PROBE_MAX_WAIT_MS,
    isAlive,
    readPort,
    sleep,
  });

  if (result.outcome === "ready") {
    console.log(
      kleur.green(`✔ restarted (pid ${childPid}, port ${result.port}, logs: ${logPath})`),
    );
    return;
  }
  if (result.outcome === "died") {
    console.log(kleur.red(`✗ daemon died during startup. tail logs: ${kleur.dim(logPath)}`));
    process.exit(1);
  }
  console.log(
    kleur.yellow(
      `restart spawned (pid ${childPid}) but didn't write a fresh port file within ${RESTART_PROBE_MAX_WAIT_MS}ms. tail logs: ${kleur.dim(logPath)}`,
    ),
  );
  process.exit(1);
};
