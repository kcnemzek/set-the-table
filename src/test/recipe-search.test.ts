import { describe, it, expect } from "vitest";
import type { WebSearchResult, WebSearchService } from "@/lib/recipe-search";

describe("WebSearchService interface", () => {
  it("implementations must satisfy the interface contract", async () => {
    // A mock service satisfying the interface
    const mockService: WebSearchService = {
      async search(query: string): Promise<WebSearchResult[]> {
        expect(typeof query).toBe("string");
        return [
          {
            title: "The Best Mac and Cheese",
            url: "https://www.seriouseats.com/the-best-mac-cheese",
            domain: "seriouseats.com",
            snippet: "A creamy stovetop mac and cheese with a crispy breadcrumb topping.",
          },
        ];
      },
    };

    const results = await mockService.search("best mac and cheese");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: expect.any(String),
      url: expect.any(String),
      domain: expect.any(String),
      snippet: expect.any(String),
    });
  });

  it("WebSearchResult requires all four fields", () => {
    const result: WebSearchResult = {
      title: "Jammy Eggs",
      url: "https://cooking.nytimes.com/recipes/jammy-eggs",
      domain: "cooking.nytimes.com",
      snippet: "Soft-boiled eggs with a jammy yolk, perfect for ramen or salads.",
    };

    expect(result.title).toBeTruthy();
    expect(result.url).toBeTruthy();
    expect(result.domain).toBeTruthy();
    expect(result.snippet).toBeTruthy();
  });

  it("swapping implementations does not change the call site", async () => {
    // Demonstrates that call sites only depend on the interface
    async function findRecipes(service: WebSearchService, query: string) {
      return service.search(query);
    }

    const serviceA: WebSearchService = {
      search: async () => [{ title: "A", url: "https://a.com/r", domain: "a.com", snippet: "..." }],
    };
    const serviceB: WebSearchService = {
      search: async () => [{ title: "B", url: "https://b.com/r", domain: "b.com", snippet: "..." }],
    };

    const fromA = await findRecipes(serviceA, "pasta");
    const fromB = await findRecipes(serviceB, "pasta");

    expect(fromA[0].title).toBe("A");
    expect(fromB[0].title).toBe("B");
  });
});
