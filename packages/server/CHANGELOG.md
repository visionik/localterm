# localterm-server

## [Unreleased]

### Features

- Add xumux v0.2 binary transport (`/xumux` WebSocket endpoint)
- Binary codec for terminal message types (input, output, resize, exit, title, session-info)
- XumuxServer multiplexer with HELLO/WELCOME handshake and channel management
- WebSocketAdapter for xumux transport over WebSocket
- Per-connection local session map prevents channel-ID collisions across concurrent connections
- Backpressure enforcement on xumux channels
- Loopback security on `/xumux` endpoint

### Bug Fixes

- Exit-code null sentinel changed from -1 to INT32_MIN so real exit code -1 is preserved
- `decodeResize` returns null on short payload instead of throwing
- `session.dispose()` called in PTY exit handler to prevent resource leak

## 0.0.11

### Patch Changes

- fix

## 0.0.10

### Patch Changes

- fix

## 0.0.9

### Patch Changes

- fix

## 0.0.8

### Patch Changes

- fix

## 0.0.7

### Patch Changes

- fix

## 0.0.6

### Patch Changes

- fix

## 0.0.5

### Patch Changes

- fix

## 0.0.4

### Patch Changes

- fix

## 0.0.3

### Patch Changes

- fix

## 0.0.2

### Patch Changes

- Fix `posix_spawnp failed` error on first shell spawn after `npm install -g localterm`.

  node-pty's prebuilt `spawn-helper` binary loses the executable bit through some npm install paths. We now `chmod 0o755` it lazily inside the `Session` constructor so the very first spawn always works, regardless of how the package was installed (npm, pnpm, yarn, monorepo, global, local).

## 0.0.1

### Patch Changes

- Initial public release.

  `localterm` is a browser-based terminal: one browser tab is one persistent PTY session. The CLI (`localterm start`) spins up a Hono + node-pty + headless-xterm daemon at `http://localterm.localhost:3417/` and ships the xterm.js front-end in the same package. Sessions are addressed by friendly `adjective-animal-suffix` ids in the URL path; closing a tab retires its shell after a 30-second grace window.
