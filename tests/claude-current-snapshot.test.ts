import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeClaudeCurrentSnapshot } from "../src/core/claude-current.js";

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

describe("Claude current snapshot", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("writes the latest current usage to an AIDash state file", () => {
    const root = mkdtempSync(path.join(tmpdir(), "aidash-snapshot-"));
    dirs.push(root);
    const claudeHome = path.join(root, ".claude");
    const home = path.join(root, ".aidash");
    const projectDir = path.join(claudeHome, "projects", "-Users-dohamsu-Workspace-graymar");
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      path.join(projectDir, "current.jsonl"),
      line({ timestamp: "2026-05-21T09:00:00.000Z", sessionId: "current", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "user", content: "live" } }) +
        line({ timestamp: "2026-05-21T09:01:00.000Z", sessionId: "current", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", id: "m-1", usage: { input_tokens: 1, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, output_tokens: 4 } } }),
      "utf8",
    );

    const result = writeClaudeCurrentSnapshot({ claudeHome, home, now: new Date("2026-05-21T09:01:02.000Z") });
    const written = JSON.parse(readFileSync(result.snapshotPath, "utf8"));

    expect(result.snapshotPath).toBe(path.join(home, "claude-current.json"));
    expect(written.current.session.tokenBreakdown.totalTokens).toBe(10);
    expect(written.current.isActive).toBe(true);
    expect(written.writtenAt).toBe("2026-05-21T09:01:02.000Z");
  });
});
