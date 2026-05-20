import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { WebSearchResult, WebSearchService } from "@/lib/recipe-search";

export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a recipe search assistant. Search the web for recipes matching the user's query and return results as a JSON array.

Return ONLY a valid JSON array with this exact shape:
[
  {
    "title": "Recipe title",
    "url": "https://full-url-to-recipe-page",
    "domain": "seriouseats.com",
    "snippet": "1-2 sentence description of the recipe and why it is notable"
  }
]

Rules:
- Return 5-8 results
- Only include direct links to actual recipe pages, not roundup lists or category pages
- domain must be just the hostname, no www. prefix, no https://
- snippet should describe what makes this recipe worth trying
- Return ONLY the JSON array, no markdown fences, no explanation`;

class ClaudeWebSearchService implements WebSearchService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic();
  }

  async search(query: string): Promise<WebSearchResult[]> {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: `Find recipes for: ${query}` },
    ];

    let response = await this.anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
      messages,
    });

    // Handle multi-turn if the model returns tool_use stop reason
    while (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      messages.push({
        role: "user",
        content: toolUseBlocks.map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "",
        })),
      });
      response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
        messages,
      });
    }

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonText = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    return JSON.parse(jsonText);
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const query = request.nextUrl.searchParams.get("query");
  if (!query?.trim()) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  try {
    const service = new ClaudeWebSearchService();
    const results = await service.search(query.trim());
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/recipes/web-search]", err);
    return NextResponse.json({ error: "Search failed", detail: String(err) }, { status: 500 });
  }
}
