import type { Terminal as XtermTerminal } from "@xterm/xterm";

/**
 * In the alt buffer, xterm.js translates wheel events into ↑/↓ arrow key
 * sequences (so `less`/`vim`/etc. respond to wheel without opting into mouse
 * reporting). Trackpads emit `DOM_DELTA_PIXEL` events at ~60 Hz with inertial
 * momentum, so a single flick can fire 30+ wheel events — each one becomes an
 * arrow keypress and the TUI jumps to the top of its list.
 *
 * Drop those pixel-delta wheels before xterm.js sees them. Real mouse wheels
 * report `DOM_DELTA_LINE` (one event per click) and pass through unchanged, so
 * clicky-mouse users still get the wheel→arrow behavior.
 *
 * Normal buffer is untouched — there the wheel scrolls scrollback, which is
 * the whole point and not pathological.
 */
export const shouldSuppressAltBufferWheel = (
  event: WheelEvent,
  terminal: XtermTerminal,
): boolean => {
  if (terminal.buffer.active.type !== "alternate") return false;
  return event.deltaMode === WheelEvent.DOM_DELTA_PIXEL;
};
