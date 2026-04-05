import { describe, it, expect } from "vitest";
import { parseAmount } from "@/lib/parse-amount";

describe("parseAmount", () => {
  it("parses whole numbers", () => {
    expect(parseAmount("2")).toBe(2);
    expect(parseAmount("10")).toBe(10);
  });

  it("parses decimals", () => {
    expect(parseAmount("0.5")).toBe(0.5);
    expect(parseAmount(".5")).toBe(0.5);
    expect(parseAmount("1.5")).toBe(1.5);
    expect(parseAmount("2.25")).toBe(2.25);
  });

  it("parses simple fractions", () => {
    expect(parseAmount("1/2")).toBe(0.5);
    expect(parseAmount("1/4")).toBe(0.25);
    expect(parseAmount("3/4")).toBe(0.75);
    expect(parseAmount("2/3")).toBeCloseTo(0.667, 2);
  });

  it("parses mixed numbers", () => {
    expect(parseAmount("1 1/2")).toBe(1.5);
    expect(parseAmount("2 3/4")).toBe(2.75);
    expect(parseAmount("1 1/4")).toBe(1.25);
  });

  it("handles whitespace", () => {
    expect(parseAmount("  1/2  ")).toBe(0.5);
    expect(parseAmount("  2  ")).toBe(2);
  });

  it("returns 0 for empty or invalid input", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
  });
});
