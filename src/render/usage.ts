import wrapAnsi from "wrap-ansi";
import type { RenderOptions, UsageBucket, UsageSummary } from "../core/types.js";
import { renderBar } from "./bar.js";
import { formatCost, formatPercent, formatTokens } from "./format.js";
import { colorize, padLeft, padRight, truncate, visibleWidth } from "./text.js";

export function renderUsage(summary: UsageSummary, options: RenderOptions): string {
  if (options.style === "plain") return renderPlain(summary, options);
  if (options.style === "compact") return renderCompact(summary, options);
  return renderDashboard(summary, options);
}

function renderDashboard(summary: UsageSummary, options: RenderOptions): string {
  const width = Math.max(58, Math.min(options.width, 96));
  const innerWidth = width - 4;
  const c = colorize(options.color);
  const title = `${c.title("AIDash")} · ${summary.rangeLabel} · ${summary.project}`;
  const lines: string[] = [];

  lines.push(topBorder(title, innerWidth));
  lines.push(boxLine(metricsLine(summary, innerWidth), innerWidth));
  lines.push(boxLine(sectionHeading("Agent", innerWidth), innerWidth));
  for (const item of summary.byAgent) lines.push(boxLine(bucketLine(item, 12, innerWidth), innerWidth));
  lines.push(separator("Topics", innerWidth));
  for (const item of summary.byTopic) lines.push(boxLine(bucketLine(item, 12, innerWidth), innerWidth));
  lines.push(separator("Recent", innerWidth));
  for (const session of summary.recentSessions) {
    const row = [
      session.timeLabel,
      padRight(session.agent, 7),
      truncate(session.topic, 24),
      padLeft(formatTokens(session.tokens), 7),
      padLeft(`${session.durationMinutes}m`, 4),
    ].join(" ");
    lines.push(boxLine(row, innerWidth));
  }
  lines.push(bottomBorder(innerWidth));

  return lines.join("\n");
}

function renderCompact(summary: UsageSummary, options: RenderOptions): string {
  const width = Math.max(52, Math.min(options.width, 80));
  const innerWidth = width - 4;
  const title = `AIDash · ${summary.rangeLabel} · ${summary.project}`;
  const lines: string[] = [];

  lines.push(topBorder(title, innerWidth));
  lines.push(boxLine(metricsLine(summary, innerWidth), innerWidth));
  for (const item of summary.byAgent) lines.push(boxLine(bucketLine(item, 10, innerWidth), innerWidth));
  lines.push(separator("Topics", innerWidth));
  for (const item of summary.byTopic.slice(0, 4)) lines.push(boxLine(bucketLine(item, 10, innerWidth), innerWidth));
  lines.push(separator("Recent", innerWidth));
  for (const session of summary.recentSessions.slice(0, 3)) {
    const row = `${session.timeLabel} ${padRight(session.agent, 7)} ${truncate(session.topic, 22)} ${padLeft(formatTokens(session.tokens), 6)} ${session.durationMinutes}m`;
    lines.push(boxLine(row, innerWidth));
  }
  lines.push(bottomBorder(innerWidth));

  return lines.join("\n");
}

function renderPlain(summary: UsageSummary, options: RenderOptions): string {
  const width = Math.max(48, options.width);
  const lines = [
    `AIDash usage - ${summary.rangeLabel} - ${summary.project}`,
    `Sessions: ${summary.totals.sessions}`,
    `Tokens: ${formatTokens(summary.totals.tokens)}`,
    `Cost: ${formatCost(summary.totals.costUsd)}`,
    "",
    "By agent",
    ...summary.byAgent.map((item) => plainBucketLine(item)),
    "",
    "By topic",
    ...summary.byTopic.map((item) => plainBucketLine(item)),
    "",
    "Recent sessions",
    ...summary.recentSessions.map(
      (session) =>
        `${session.timeLabel} ${session.agent} ${session.topic} ${formatTokens(session.tokens)} ${session.durationMinutes}m`,
    ),
  ];

  return lines.map((line) => wrapAnsi(line, width, { hard: false, trim: false })).join("\n");
}

function metricsLine(summary: UsageSummary, width: number): string {
  const raw = `Sessions ${summary.totals.sessions}   Tokens ${formatTokens(summary.totals.tokens)}   Cost ${formatCost(summary.totals.costUsd)}`;
  return truncate(raw, width);
}

function bucketLine(item: UsageBucket, barWidth: number, width: number): string {
  const row = `${padRight(truncate(item.name, 12), 12)} ${padLeft(formatTokens(item.tokens), 7)}  ${renderBar(item.percent, barWidth)} ${padLeft(formatPercent(item.percent), 4)}`;
  return truncate(row, width);
}

function plainBucketLine(item: UsageBucket): string {
  return `${item.name}: ${formatTokens(item.tokens)} ${renderBar(item.percent, 20, true)} ${formatPercent(item.percent)} ${formatCost(item.costUsd)}`;
}

function sectionHeading(label: string, width: number): string {
  return padRight(label, width);
}

function topBorder(title: string, width: number): string {
  const cleanTitle = ` ${title} `;
  const dashCount = Math.max(0, width - visibleWidth(cleanTitle));
  return `╭─${cleanTitle}${"─".repeat(dashCount)}─╮`;
}

function separator(label: string, width: number): string {
  const cleanLabel = ` ${label} `;
  const dashCount = Math.max(0, width - visibleWidth(cleanLabel));
  return `├─${cleanLabel}${"─".repeat(dashCount)}─┤`;
}

function bottomBorder(width: number): string {
  return `╰${"─".repeat(width + 2)}╯`;
}

function boxLine(value: string, width: number): string {
  return `│ ${padRight(truncate(value, width), width)} │`;
}
