#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { runUsageCommand } from "./commands/usage.js";
import type { RenderStyle } from "./core/types.js";

const program = new Command();

program
  .name("aidash")
  .description("Local-first CLI dashboard for AI coding CLI usage.")
  .version("0.1.0");

program
  .command("usage")
  .description("Show AI coding CLI usage summary.")
  .option("--demo", "use bundled demo data", true)
  .option("--style <style>", "output style: dashboard, compact, or plain", parseStyle)
  .option("--json", "emit summary data as JSON")
  .option("--no-color", "disable ANSI color")
  .option("--cwd <path>", "workspace path used for project detection")
  .action((options) => {
    process.stdout.write(
      runUsageCommand({
        demo: options.demo,
        style: options.style,
        json: options.json,
        color: options.color,
        cwd: options.cwd,
      }),
    );
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
