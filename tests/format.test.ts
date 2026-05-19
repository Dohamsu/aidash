import { describe, expect, it } from "vitest";
import { formatCost, formatPercent, formatTokens } from "../src/render/format.js";
import { renderBar } from "../src/render/bar.js";

describe("formatting helpers", () => {
  it("formats percentages with whole numbers by default", () => {
    expect(formatPercent(0.772)).toBe("77%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("formats token counts for compact dashboard display", () => {
    expect(formatTokens(184_200)).toBe("184.2k");
    expect(formatTokens(51_240)).toBe("51.2k");
    expect(formatTokens(980)).toBe("980");
  });

  it("formats costs as USD", () => {
    expect(formatCost(0.92)).toBe("$0.92");
    expect(formatCost(12)).toBe("$12.00");
  });

  it("renders fixed-width bars with rounded fill", () => {
    expect(renderBar(0.77, 12, false)).toBe("█████████░░░");
    expect(renderBar(0.23, 12, false)).toBe("███░░░░░░░░░");
    expect(renderBar(0.6, 10, true)).toBe("######----");
  });
});
