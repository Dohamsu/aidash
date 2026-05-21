#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { runClaudeCurrentCommand, runClaudeCurrentDaemon, runClaudeCurrentDaemonOnce, watchClaudeCurrent } from "./commands/claude-current.js";
import { runDoctorClaudeCommand } from "./commands/doctor.js";
import { runImportClaudeHistoryCommand, runImportClaudeSessionCommand } from "./commands/import-claude-history.js";
import { runInstallClaudeCurrentAgentCommand, runInstallClaudeHookCommand, runInstallClaudePackageCommand, runInstallClaudeUsageCommand, runInstallShellCommand, runUninstallShellCommand } from "./commands/install.js";
import { runInitCommand } from "./commands/init.js";
import { runRecordCommand } from "./commands/record.js";
import { runAndRecord } from "./commands/run.js";
import { runUsageCommand } from "./commands/usage.js";
import type { AgentName, RenderStyle } from "./core/types.js";

const program = new Command();

program
  .name("aidash")
  .description("Local-first CLI dashboard for AI coding CLI usage.")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize the local AIDash usage store.")
  .option("--home <path>", "override AIDash data directory")
  .action((options) => {
    process.stdout.write(runInitCommand({ home: options.home }));
  });

program
  .command("usage")
  .description("Show AI coding CLI usage summary.")
  .option("--demo", "use bundled demo data")
  .option("--style <style>", "output style: dashboard, compact, or plain", parseStyle)
  .option("--json", "emit summary data as JSON")
  .option("--no-color", "disable ANSI color")
  .option("--cwd <path>", "workspace path used for project detection")
  .option("--all-projects", "summarize every stored session instead of only the current project")
  .option("--sessions", "show every session with token-share progress bars")
  .option("--home <path>", "override AIDash data directory")
  .action((options) => {
    process.stdout.write(
      runUsageCommand({
        demo: options.demo,
        style: options.style,
        json: options.json,
        color: options.color,
        cwd: options.cwd,
        allProjects: options.allProjects,
        sessions: options.sessions,
        home: options.home,
      }),
    );
  });

program
  .command("doctor")
  .description("Diagnose AIDash integrations.")
  .command("claude")
  .description("Check Claude Code hook, slash commands, transcript, and store access.")
  .option("--claude-home <path>", "override Claude home directory")
  .option("--home <path>", "override AIDash data directory")
  .option("--cli-path <path>", "absolute path to dist/cli.js expected in the Stop hook")
  .option("--cwd <path>", "workspace path used for transcript matching")
  .action((options) => {
    process.stdout.write(runDoctorClaudeCommand(options));
  });

program
  .command("install")
  .description("Install AIDash integrations.")
  .command("shell")
  .description("Install a zsh wrapper so `claude` records usage through AIDash.")
  .option("--dry-run", "show the change without writing")
  .option("--zshrc <path>", "override zshrc path")
  .action((options) => {
    process.stdout.write(runInstallShellCommand(options));
  });

program
  .command("uninstall")
  .description("Remove AIDash integrations.")
  .command("shell")
  .description("Remove the zsh wrapper installed by AIDash.")
  .option("--dry-run", "show the change without writing")
  .option("--zshrc <path>", "override zshrc path")
  .action((options) => {
    process.stdout.write(runUninstallShellCommand(options));
  });

program
  .command("install-claude-hook")
  .description("Install a Claude Code Stop hook that imports completed transcripts into AIDash.")
  .option("--dry-run", "show the settings change without writing")
  .option("--settings-path <path>", "override Claude settings.json path")
  .option("--cli-path <path>", "absolute path to dist/cli.js for the hook command")
  .action((options) => {
    process.stdout.write(runInstallClaudeHookCommand(options));
  });

program
  .command("install-claude-current-agent")
  .description("Install a macOS launchd agent that snapshots current Claude usage in the background.")
  .option("--dry-run", "show the plist without writing")
  .requiredOption("--cli-path <path>", "absolute path to dist/cli.js for launchd")
  .option("--plist-path <path>", "override launch agent plist path")
  .option("--interval <seconds>", "snapshot interval", parsePositiveNumber)
  .action((options) => {
    process.stdout.write(runInstallClaudeCurrentAgentCommand({ ...options, intervalSeconds: options.interval }));
  });

program
  .command("install-claude-aiusage")
  .description("Install a Claude Code /aiusage slash command backed by AIDash.")
  .option("--dry-run", "show the slash command without writing")
  .requiredOption("--cli-path <path>", "absolute path to dist/cli.js for the slash command")
  .option("--command-path <path>", "override slash command markdown path")
  .option("--commands-dir <path>", "install both /aiusage and /au into this commands directory")
  .action((options) => {
    process.stdout.write(runInstallClaudeUsageCommand(options));
  });

program
  .command("install-claude")
  .description("Install Claude Code AIDash package: Stop hook plus /aiusage and /au slash commands.")
  .option("--dry-run", "show the changes without writing")
  .requiredOption("--cli-path <path>", "absolute path to dist/cli.js")
  .option("--settings-path <path>", "override Claude settings.json path")
  .option("--commands-dir <path>", "override Claude slash commands directory")
  .action((options) => {
    process.stdout.write(runInstallClaudePackageCommand(options));
  });

program
  .command("import")
  .description("Import historical usage from local AI coding tools.")
  .command("claude-history")
  .description("Import Claude Code transcript usage from ~/.claude/projects.")
  .option("--dry-run", "scan and summarize without writing to the AIDash store")
  .option("--claude-home <path>", "override Claude home directory")
  .option("--home <path>", "override AIDash data directory")
  .option("--include-subagents", "include Claude Code subagent transcripts")
  .option("--since <date>", "only import sessions starting on or after this date")
  .option("--transcript <path>", "import a single transcript JSONL file")
  .action((options) => {
    process.stdout.write(runImportClaudeHistoryCommand(options));
  });

program
  .command("import-claude-session")
  .description("Import one Claude Code transcript from --transcript, hook stdin, or CLAUDE_TRANSCRIPT_PATH.")
  .option("--dry-run", "scan and summarize without writing to the AIDash store")
  .option("--home <path>", "override AIDash data directory")
  .option("--transcript <path>", "import a single transcript JSONL file")
  .action(async (options) => {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    process.stdout.write(runImportClaudeSessionCommand(options, Buffer.concat(chunks).toString("utf8")));
  });

program
  .command("claude-current")
  .description("Show the currently active/recent Claude Code transcript usage, optionally live-refreshing.")
  .option("--claude-home <path>", "override Claude home directory")
  .option("--transcript <path>", "read a specific transcript JSONL file")
  .option("--include-subagents", "include subagent transcripts when finding the most recent file")
  .option("--stale-after <seconds>", "seconds after transcript update before marking stale", parsePositiveNumber)
  .option("--json", "emit current usage as JSON")
  .option("--home <path>", "override AIDash data directory for cached snapshots")
  .option("--cwd <path>", "workspace path used for transcript matching and project totals")
  .option("--compact", "emit compact /au-style output")
  .option("--budget-tokens <count>", "token budget used for the compact progress bar", parsePositiveNumber)
  .option("--watch", "refresh until interrupted")
  .option("--interval <seconds>", "watch refresh interval", parsePositiveNumber)
  .action((options) => {
    const commandOptions = {
      claudeHome: options.claudeHome,
      transcriptPath: options.transcript,
      includeSubagents: options.includeSubagents,
      staleAfterSeconds: options.staleAfter,
      json: options.json,
      home: options.home,
      cwd: options.cwd,
      compact: options.compact,
      budgetTokens: options.budgetTokens,
      intervalSeconds: options.interval,
    };
    if (options.watch) watchClaudeCurrent(commandOptions);
    else process.stdout.write(runClaudeCurrentCommand(commandOptions));
  });

program
  .command("claude-current-daemon")
  .description("Continuously snapshot current Claude usage for background launchd agents.")
  .option("--claude-home <path>", "override Claude home directory")
  .option("--home <path>", "override AIDash data directory")
  .option("--include-subagents", "include subagent transcripts when finding the most recent file")
  .option("--stale-after <seconds>", "seconds after transcript update before marking stale", parsePositiveNumber)
  .option("--interval <seconds>", "snapshot interval", parsePositiveNumber)
  .option("--once", "write one snapshot and exit")
  .action((options) => {
    const commandOptions = {
      claudeHome: options.claudeHome,
      home: options.home,
      includeSubagents: options.includeSubagents,
      staleAfterSeconds: options.staleAfter,
      intervalSeconds: options.interval,
    };
    if (options.once) process.stdout.write(runClaudeCurrentDaemonOnce(commandOptions));
    else runClaudeCurrentDaemon(commandOptions);
  });

program
  .command("record")
  .description("Manually record an AI coding session.")
  .requiredOption("--agent <agent>", "agent name: Claude, Codex, OpenCode, or Other", parseAgent)
  .requiredOption("--tokens <count>", "total tokens")
  .option("--input-tokens <count>", "input tokens")
  .option("--output-tokens <count>", "output tokens")
  .option("--cost <usd>", "cost in USD", "0")
  .option("--topic <topic>", "work topic")
  .option("--summary <text>", "session summary")
  .option("--project <name>", "project name override")
  .option("--cwd <path>", "project cwd override")
  .option("--duration-minutes <minutes>", "session duration in minutes", "0")
  .option("--home <path>", "override AIDash data directory")
  .action((options) => {
    process.stdout.write(runRecordCommand(options));
  });

program
  .command("run")
  .description("Run a CLI command and record usage when structured output is available.")
  .allowUnknownOption(true)
  .argument("<command>", "command to run, e.g. claude")
  .argument("[args...]", "arguments passed to the command")
  .option("--topic <topic>", "topic override for the recorded session")
  .option("--summary <text>", "summary override for the recorded session")
  .option("--cwd <path>", "working directory for the command")
  .option("--home <path>", "override AIDash data directory")
  .action((command: string, args: string[], options) => {
    process.exitCode = runAndRecord(command, args ?? [], options);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

function parseStyle(value: string): RenderStyle {
  if (value === "dashboard" || value === "compact" || value === "plain") return value;
  throw new InvalidArgumentError("style must be one of: dashboard, compact, plain");
}

function parsePositiveNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new InvalidArgumentError("value must be a positive number");
  return parsed;
}

function parseAgent(value: string): AgentName {
  if (value === "Claude" || value === "Codex" || value === "OpenCode" || value === "Other") return value;
  throw new InvalidArgumentError("agent must be one of: Claude, Codex, OpenCode, Other");
}
