export type TerminalCursorStyle = "block" | "underline" | "bar";

interface TerminalCursorStyleOption {
  id: TerminalCursorStyle;
  name: string;
}

export const TERMINAL_CURSOR_STYLES: readonly TerminalCursorStyleOption[] = [
  { id: "block", name: "Block" },
  { id: "bar", name: "Bar" },
  { id: "underline", name: "Underline" },
];

export const DEFAULT_TERMINAL_CURSOR_STYLE: TerminalCursorStyle = "block";

const VALID_CURSOR_STYLE_IDS: readonly string[] = TERMINAL_CURSOR_STYLES.map((option) => option.id);

export const isTerminalCursorStyle = (value: unknown): value is TerminalCursorStyle =>
  typeof value === "string" && VALID_CURSOR_STYLE_IDS.includes(value);
