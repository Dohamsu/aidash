import pc from "picocolors";
import stringWidth from "string-width";
import stripAnsi from "strip-ansi";

export function colorize(enabled: boolean) {
  return {
    title: (value: string) => (enabled ? pc.cyan(pc.bold(value)) : value),
    label: (value: string) => (enabled ? pc.dim(value) : value),
    good: (value: string) => (enabled ? pc.green(value) : value),
    muted: (value: string) => (enabled ? pc.gray(value) : value),
  };
}

export function visibleWidth(value: string): number {
  return stringWidth(stripAnsi(value));
}

export function padRight(value: string, width: number): string {
  return value + " ".repeat(Math.max(0, width - visibleWidth(value)));
}

export function padLeft(value: string, width: number): string {
  return " ".repeat(Math.max(0, width - visibleWidth(value))) + value;
}

export function truncate(value: string, width: number): string {
  if (visibleWidth(value) <= width) return value;
  if (width <= 1) return "…".slice(0, Math.max(0, width));

  const plain = stripAnsi(value);
  let output = "";
  for (const char of plain) {
    if (visibleWidth(`${output}${char}…`) > width) break;
    output += char;
  }
  return `${output}…`;
}
