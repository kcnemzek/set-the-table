import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { traceable } from "langsmith/traceable";
import { extractTextFromHtml } from "@/lib/extract-html-text";

const AISLES = [
  "Produce", "Meat & Seafood", "Dairy", "Grains & Pasta",
  "Canned & Dry Goods", "Baking", "Spices & Herbs", "Oils & Condiments",
  "Frozen", "Beverages", "Nuts & Snacks", "Miscellaneous",
];

const SYSTEM_PROMPT = `You are a recipe parser. Extract recipe information from the provided text and return it as JSON.

Return ONLY a valid JSON object with this exact shape:
{
  "title": "Recipe name",
  "servings": 4,
  "ingredients": [
    { "text": "2 cups flour", "aisle": "Baking" }
  ],
  "directions": "Step 1: ...\nStep 2: ..."
}

Rules:
- title: the recipe name, properly capitalized
- servings: number only, use 0 if not found
- ingredients: each as a natural text string (e.g. "2 cups flour", "3 eggs", "1/2 tsp salt")
- aisle: assign one of exactly these values: ${AISLES.join(", ")}
- directions: plain text, steps separated by newlines
- Return ONLY the JSON object, no markdown, no explanation`;

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url } = body;
  if (!url?.trim()) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let pageText: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RecipeImporter/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not fetch page", detail: `HTTP ${res.status}` },
        { status: 422 }
      );
    }
    const html = await res.text();
    pageText = extractTextFromHtml(html);
  } catch (err) {
    return NextResponse.json(
      { error: "Could not fetch page", detail: String(err) },
      { status: 422 }
    );
  }

  const anthropic = new Anthropic();

  const callClaude = traceable(
    (messages: Anthropic.MessageParam[]) =>
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    {
      name: "fetch-url-recipe",
      run_type: "llm",
      metadata: { ls_model_name: MODEL, ls_provider: "anthropic", ls_model_type: "chat" },
    }
  );

  try {
    const message = await callClaude([
      { role: "user", content: `Extract the recipe from this text:\n\n${pageText}` },
    ]);

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonText = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/recipes/fetch-url]", err);
    return NextResponse.json(
      { error: "Failed to parse recipe", detail: String(err) },
      { status: 500 }
    );
  }
}
