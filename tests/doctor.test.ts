import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runDoctorClaudeCommand } from "../src/commands/doctor.js";

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

describe("doctor claude", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("checks hook, slash commands, transcript readability, and AIDash store", () => {
    const root = mkdtempSync(path.join(tmpdir(), "aidash-doctor-"));
    dirs.push(root);
    const claudeHome = path.join(root, ".claude");
    const aidashHome = path.join(root, ".aidash");
    const cliPath = "/work/aidash/dist/cli.js";
    mkdirSync(path.join(claudeHome, "commands"), { recursive: true });
    writeFileSync(
      path.join(claudeHome, "settings.json"),
      JSON.stringify({ hooks: { Stop: [{ matcher: "", hooks: [{ type: "command", command: `node ${cliPath} import-claude-session` }] }] } }, null, 2),
      "utf8",
    );
    writeFileSync(path.join(claudeHome, "commands", "aiusage.md"), "aiusage", "utf8");
    writeFileSync(path.join(claudeHome, "commands", "au.md"), "au", "utf8");
    const projectDir = path.join(claudeHome, "projects", "-work-aidash");
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      path.join(projectDir, "session.jsonl"),
      line({ timestamp: "2026-05-21T00:00:00.000Z", sessionId: "s", cwd: "/work/aidash", message: { role: "user", content: "hi" } }) +
        line({ timestamp: "2026-05-21T00:00:01.000Z", sessionId: "s", cwd: "/work/aidash", message: { role: "assistant", id: "m", usage: { input_tokens: 1, output_tokens: 1 } } }),
      "utf8",
    );
    mkdirSync(aidashHome, { recursive: true });

    const output = runDoctorClaudeCommand({ claudeHome, home: aidashHome, cliPath, cwd: "/work/aidash" });

    expect(output).toContain("AIDash Claude doctor");
    expect(output).toContain("✓ Stop hook installed");
    expect(output).toContain("✓ /aiusage installed");
    expect(output).toContain("✓ /au installed");
    expect(output).toContain("✓ latest transcript readable");
    expect(output).toContain("✓ AIDash store writable");
  });
});
