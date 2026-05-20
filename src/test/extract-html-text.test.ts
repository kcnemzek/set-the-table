import { describe, it, expect } from "vitest";
import { extractTextFromHtml } from "@/lib/extract-html-text";

describe("extractTextFromHtml", () => {
  it("strips script tags and their content", () => {
    const html = '<p>Ingredients</p><script>alert("xss")</script><p>flour</p>';
    const result = extractTextFromHtml(html);
    expect(result).not.toContain("alert");
    expect(result).toContain("flour");
  });

  it("strips style tags and their content", () => {
    const html = "<style>.recipe { color: red }</style><p>directions</p>";
    const result = extractTextFromHtml(html);
    expect(result).not.toContain("color");
    expect(result).toContain("directions");
  });

  it("strips nav, header, and footer blocks", () => {
    const html = "<nav>Home | About</nav><main>2 cups flour</main><footer>© 2024</footer>";
    const result = extractTextFromHtml(html);
    expect(result).not.toContain("Home | About");
    expect(result).not.toContain("© 2024");
    expect(result).toContain("2 cups flour");
  });

  it("decodes common HTML entities", () => {
    const html = "<p>Salt &amp; pepper, 1&#39;&#39; dice, &quot;al dente&quot;</p>";
    const result = extractTextFromHtml(html);
    expect(result).toContain("Salt & pepper");
    expect(result).toContain(`1'' dice`);
    expect(result).toContain('"al dente"');
  });

  it("replaces block elements with newlines", () => {
    const html = "<p>Step 1</p><p>Step 2</p><p>Step 3</p>";
    const result = extractTextFromHtml(html);
    expect(result).toContain("Step 1");
    expect(result).toContain("Step 2");
    expect(result).toContain("Step 3");
    expect(result.split("\n").length).toBeGreaterThan(1);
  });

  it("collapses excessive blank lines", () => {
    const html = "<p>a</p>\n\n\n\n\n<p>b</p>";
    const result = extractTextFromHtml(html);
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("truncates output to 8000 characters", () => {
    const longContent = "<p>" + "x".repeat(20000) + "</p>";
    const result = extractTextFromHtml(longContent);
    expect(result.length).toBeLessThanOrEqual(8000);
  });

  it("handles empty input", () => {
    expect(extractTextFromHtml("")).toBe("");
  });

  it("strips all remaining HTML tags", () => {
    const html = '<span class="ingredient">2 cups <strong>flour</strong></span>';
    const result = extractTextFromHtml(html);
    expect(result).toContain("2 cups");
    expect(result).toContain("flour");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });
});
