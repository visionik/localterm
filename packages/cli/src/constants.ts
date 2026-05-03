export const FORCE_EXIT_TIMEOUT_MS = 3000;
export const STOP_POLL_INTERVAL_MS = 100;
export const STOP_MAX_WAIT_MS = 5000;
export const RESTART_PROBE_INTERVAL_MS = 100;
export const RESTART_PROBE_MAX_WAIT_MS = 2000;

export const FRIENDLY_HOSTNAME = "localterm.localhost";

export const getFriendlyUrl = (port: number, pathSegment = ""): string => {
  const segment = pathSegment ? `/${encodeURIComponent(pathSegment)}` : "";
  return `http://${FRIENDLY_HOSTNAME}:${port}${segment}`;
};
