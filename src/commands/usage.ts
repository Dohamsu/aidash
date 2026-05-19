import { getDemoUsageSummary } from "../core/demo-data.js";
import { createUsageStore, filterSessionsForCwd, summarizeSessions } from "../core/store.js";
import type { RenderStyle } from "../core/types.js";
import { renderUsage } from "../render/usage.js";

export type UsageCommandOptions = {
  demo?: boolean;
  style?: RenderStyle;
  json?: boolean;
  color?: boolean;
  cwd?: string;
  allProjects?: boolean;
  home?: string;
};

export function runUsageCommand(options: UsageCommandOptions): string {
  const cwd = options.cwd ?? process.cwd();
  const store = createUsageStore(options.home);
  const sessions = options.demo
    ? []
    : options.allProjects
      ? store.readSessions()
      : filterSessionsForCwd(store.readSessions(), cwd);
  const summary = options.demo ? getDemoUsageSummary(cwd) : summarizeSessions(sessions, cwd, "All time");

  if (options.json) {
    return `${JSON.stringify(summary, null, 2)}\n`;
  }

  const style = options.style ?? defaultStyle();
  const color = options.color ?? defaultColor(style);
  const width = process.stdout.columns ?? 80;

  return `${renderUsage(summary, { style, color, width })}\n`;
}

function defaultStyle(): RenderStyle {
  if (process.env.CI || !process.stdout.isTTY) return "plain";
  const width = process.stdout.columns ?? 80;
  return width < 70 ? "compact" : "dashboard";
}

function defaultColor(style: RenderStyle): boolean {
  if (style === "compact" || style === "plain") return false;
  return Boolean(process.stdout.isTTY && !process.env.NO_COLOR);
}
