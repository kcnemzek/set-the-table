import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { wrapSDK } from "langsmith/wrappers";

const AISLES = [
  "Produce", "Meat & Seafood", "Dairy", "Grains & Pasta",
  "Canned & Dry Goods", "Baking", "Spices & Herbs", "Oils & Condiments",
  "Frozen", "Beverages", "Nuts & Snacks", "Miscellaneous",
];

const SYSTEM_PROMPT = `You are a recipe parser. Extract recipe information from the provided text or image and return it as JSON.

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

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let body: { text?: string; imageBase64?: string; mimeType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, imageBase64, mimeType } = body;

  if (!text && !imageBase64) {
    return NextResponse.json({ error: "text or imageBase64 required" }, { status: 400 });
  }

  const rawClient = new Anthropic();
  const client = wrapSDK(rawClient, { projectName: "whats-for-dinner" });

  const userContent: Anthropic.MessageParam["content"] = [];

  if (imageBase64) {
    const validMime = (mimeType === "image/png" || mimeType === "image/gif" || mimeType === "image/webp")
      ? mimeType
      : "image/jpeg";
    userContent.push({
      type: "image",
      source: { type: "base64", media_type: validMime, data: imageBase64 },
    });
    userContent.push({ type: "text", text: "Extract the recipe from this image." });
  } else {
    userContent.push({ type: "text", text: `Extract the recipe from this text:\n\n${text}` });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown code fences if the model wraps its output
    const jsonText = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse recipe", detail: String(err) },
      { status: 500 }
    );
  }
}
