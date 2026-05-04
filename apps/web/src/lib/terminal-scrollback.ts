interface TerminalScrollbackOption {
  value: number;
  label: string;
}

export const TERMINAL_SCROLLBACK_PRESETS: readonly TerminalScrollbackOption[] = [
  { value: 1000, label: "1k lines" },
  { value: 10000, label: "10k lines" },
  { value: 50000, label: "50k lines" },
  { value: 100000, label: "100k lines" },
];

export const DEFAULT_TERMINAL_SCROLLBACK_LINES: number = 10000;

const VALID_SCROLLBACK_VALUES: readonly number[] = TERMINAL_SCROLLBACK_PRESETS.map(
  (preset) => preset.value,
);

export const isTerminalScrollbackValue = (value: number): boolean =>
  VALID_SCROLLBACK_VALUES.includes(value);
