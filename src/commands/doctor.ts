import * as fs from "node:fs";
import * as path from "node:path";
import { getClaudeCurrentUsage } from "../core/claude-current.js";
import { createUsageStore } from "../core/store.js";
import { defaultClaudeCommandsDir, defaultClaudeSettings } from "../core/install.js";
import { defaultClaudeHome } from "../core/claude-transcript.js";

export type DoctorClaudeOptions = {
  claudeHome?: string;
  home?: string;
  cliPath?: string;
  cwd?: string;
};

export function runDoctorClaudeCommand(options: DoctorClaudeOptions = {}): string {
  const claudeHome = options.claudeHome ?? defaultClaudeHome();
  const settingsPath = path.join(claudeHome, "settings.json");
  const commandsDir = path.join(claudeHome, "commands");
  const checks = [
    checkStopHook(settingsPath, options.cliPath),
    checkFile(path.join(commandsDir, "aiusage.md"), "/aiusage installed"),
    checkFile(path.join(commandsDir, "au.md"), "/au installed"),
    checkCurrentTranscript(claudeHome, options.cwd),
    checkStoreWritable(options.home),
  ];
  const ok = checks.every((check) => check.ok);
  return ["AIDash Claude doctor", ...checks.map(formatCheck), ok ? "Result: OK" : "Result: attention needed"].join("\n") + "\n";
}

function checkStopHook(settingsPath: string, cliPath?: string): { ok: boolean; label: string; detail?: string } {
  const expected = cliPath ? `node ${cliPath} import-claude-session` : "import-claude-session";
  try {
    const text = fs.readFileSync(settingsPath, "utf8");
    return { ok: text.includes(expected), label: "Stop hook installed", detail: settingsPath };
  } catch {
    return { ok: false, label: "Stop hook installed", detail: `${settingsPath} not readable` };
  }
}

function checkFile(file: string, label: string): { ok: boolean; label: string; detail?: string } {
  return { ok: fs.existsSync(file), label, detail: file };
}

function checkCurrentTranscript(claudeHome: string, cwd?: string): { ok: boolean; label: string; detail?: string } {
  const current = getClaudeCurrentUsage({ claudeHome, cwd });
  return { ok: Boolean(current), label: "latest transcript readable", detail: current?.transcriptPath ?? path.join(claudeHome, "projects") };
}

function checkStoreWritable(home?: string): { ok: boolean; label: string; detail?: string } {
  try {
    const store = createUsageStore(home);
    store.init();
    fs.accessSync(store.dir, fs.constants.W_OK);
    return { ok: true, label: "AIDash store writable", detail: store.dir };
  } catch (error) {
    return { ok: false, label: "AIDash store writable", detail: error instanceof Error ? error.message : String(error) };
  }
}

function formatCheck(check: { ok: boolean; label: string; detail?: string }): string {
  return `${check.ok ? "✓" : "✗"} ${check.label}${check.detail ? ` — ${check.detail}` : ""}`;
}
