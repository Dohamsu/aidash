import { clamp } from "./format.js";

export function renderBar(percent: number, width: number, ascii = false): string {
  const safeWidth = Math.max(0, Math.floor(width));
  const filled = Math.round(clamp(percent) * safeWidth);
  const empty = safeWidth - filled;
  const fillChar = ascii ? "#" : "█";
  const emptyChar = ascii ? "-" : "░";
  return `${fillChar.repeat(filled)}${emptyChar.repeat(empty)}`;
}
