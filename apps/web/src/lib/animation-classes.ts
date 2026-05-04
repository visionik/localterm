/**
 * Shared Tailwind class strings for the translucent overlay panels (popovers,
 * select content) so both popover-style menus animate identically.
 *
 * Easing follows the animation-best-practices skill:
 *   - Use a snappy custom curve (--ease-snappy) instead of generic ease-out for
 *     prominent transitions; built-in curves lack energy.
 *   - Never use `ease-in` on UI animations — same easing on close as on open
 *     so the exit doesn't feel back-loaded.
 *
 * Origin is left to Base UI's auto `--transform-origin` from the popover/select
 * primitives so panels scale from their trigger, not from a hardcoded corner.
 *
 * NEW shadcn overlay components (dropdown-menu, hover-card, command, etc.)
 * SHOULD reuse these constants instead of redefining their own animation
 * classes. shadcn-generated defaults often include `data-closed:ease-in` and a
 * fixed origin — both forbidden here. Reusing this file keeps every floating
 * panel in lockstep.
 */

export const TRANSLUCENT_PANEL_CLASSES =
  "border border-border/60 bg-background/70 text-muted-foreground shadow-xs ring-0 backdrop-blur-md";

export const PANEL_ANIMATION_CLASSES =
  "duration-150 ease-snappy data-closed:duration-100 data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:blur-out-[5px] data-closed:slide-out-to-top-2 data-open:fade-in-0 data-open:zoom-in-95 data-open:blur-in-[5px] data-open:slide-in-from-top-2";
