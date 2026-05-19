import { describe, expect, it } from "vitest";
import { parseClaudeJsonUsage } from "../src/core/claude.js";

describe("Claude JSON usage parser", () => {
  it("extracts token and cost fields from Claude print-mode JSON", () => {
    const usage = parseClaudeJsonUsage(
      JSON.stringify({
        type: "result",
        result: "Done\nMore details",
        total_cost_usd: 0.0787,
        usage: {
          input_tokens: 100,
          cache_creation_input_tokens: 10,
          cache_read_input_tokens: 20,
          output_tokens: 30,
        },
      }),
    );

    expect(usage).toMatchObject({
      inputTokens: 130,
      outputTokens: 30,
      totalTokens: 160,
      costUsd: 0.0787,
      tokenSource: "actual",
      summary: "Done",
    });
  });

  it("returns unknown usage for non-json output", () => {
    expect(parseClaudeJsonUsage("plain text")).toMatchObject({ totalTokens: 0, costUsd: 0, tokenSource: "unknown" });
  });
});
