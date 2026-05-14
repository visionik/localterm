export const DEFAULT_PORT = 3417;
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_COLS = 120;
export const DEFAULT_ROWS = 32;
export const DEFAULT_SHELL_FALLBACK = "/bin/sh";

export const TERM_TYPE = "xterm-256color";
export const COLORTERM_VALUE = "truecolor";

export const TITLE_POLL_INTERVAL_MS = 500;
export const CWD_RESOLVE_TIMEOUT_MS = 250;
export const CWD_RESOLVE_BACKOFF_MS = 30_000;
export const TITLE_MAX_PATH_SEGMENTS = 3;
export const TITLE_TRUNCATION_PREFIX = "…";

/**
 * Strip terminal-emulator identity env vars inherited from the daemon's parent.
 * If we leak e.g. TERM_PROGRAM=ghostty, modern Ink-based TUIs (Cursor Agent,
 * Claude Code) will probe for that terminal's protocol (kitty keyboard,
 * XTQVERSION, XTGETTCAP, OSC 1337, etc.) and — when xterm.js doesn't answer —
 * fall back to a degraded inline-plain rendering instead of the full boxed
 * TUI. Removing these lets the TUI treat us as a generic xterm-256color and
 * render normally.
 */
export const PTY_ENV_DENYLIST = [
  "LOCALTERM_DAEMON_CHILD",
  "TERM_PROGRAM",
  "TERM_PROGRAM_VERSION",
  "TERM_SESSION_ID",
  "ITERM_SESSION_ID",
  "ITERM_PROFILE",
  "KITTY_WINDOW_ID",
  "KITTY_PID",
  "WT_SESSION",
  "WT_PROFILE_ID",
  "GHOSTTY_RESOURCES_DIR",
  "GHOSTTY_BIN_DIR",
  "VSCODE_INJECTION",
  "VSCODE_GIT_IPC_HANDLE",
];

export const MAX_INPUT_BYTES = 64 * 1024;
export const MAX_OUTPUT_BYTES = 1 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 4 * 1024;
export const MAX_COLS = 1000;
export const MAX_ROWS = 1000;
export const MAX_CONCURRENT_SESSIONS = 64;
export const WS_BACKPRESSURE_THRESHOLD_BYTES = 8 * 1024 * 1024;

export const LOOPBACK_HOSTS = new Set([
  "127.0.0.1",
  "localhost",
  "::1",
  "[::1]",
  "0:0:0:0:0:0:0:1",
]);

export const HTTP_STATUS_NOT_FOUND = 404;

export const WS_CLOSE_POLICY_VIOLATION = 1008;
