import { describe, expect, it } from "vitest";
import stripAnsi from "strip-ansi";
import { getDemoUsageSummary } from "../src/core/demo-data.js";
import { renderUsage } from "../src/render/usage.js";

describe("usage output modes", () => {
  const summary = getDemoUsageSummary("/work/graymar");

  it("renders dashboard output with title and key sections", () => {
    const output = renderUsage(summary, { style: "dashboard", color: false, width: 80 });

    expect(output).toContain("AIDash");
    expect(output).toContain("Sessions");
    expect(output).toContain("Tokens");
    expect(output).toContain("Agent");
    expect(output).toContain("Topics");
    expect(output).toContain("Recent");
    expect(stripAnsi(output)).toBe(output);
  });

  it("renders compact no-color output that stays concise", () => {
    const output = renderUsage(summary, { style: "compact", color: false, width: 72 });

    expect(output).toContain("AIDash");
    expect(output).toContain("Claude");
    expect(output).toContain("Codex");
    expect(output).not.toContain("\u001b[");
    expect(output.split("\n").length).toBeLessThanOrEqual(14);
  });

  it("renders plain output without box drawing", () => {
    const output = renderUsage(summary, { style: "plain", color: false, width: 80 });

    expect(output).toContain("AIDash usage");
    expect(output).toContain("By agent");
    expect(output).toContain("Recent sessions");
    expect(output).not.toMatch(/[╭╮╰╯│├┤─]/);
  });

  it("exposes the same summary data as JSON", () => {
    expect(summary.totals.sessions).toBe(7);
    expect(summary.byAgent[0]).toMatchObject({ name: "Claude", tokens: 142_100 });
    expect(summary.recentSessions[0]).toHaveProperty("summary");
  });
});
