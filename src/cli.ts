#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
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
        home: options.home,
      }),
    );
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

function parseAgent(value: string): AgentName {
  if (value === "Claude" || value === "Codex" || value === "OpenCode" || value === "Other") return value;
  throw new InvalidArgumentError("agent must be one of: Claude, Codex, OpenCode, Other");
}
