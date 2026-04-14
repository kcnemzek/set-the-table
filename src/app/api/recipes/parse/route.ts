import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { traceable } from "langsmith/traceable";

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

  let body: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
    images?: { base64: string; mimeType: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, imageBase64, mimeType } = body;
  // Normalise to an images array; support legacy single-image fields too
  const images: { base64: string; mimeType: string }[] =
    body.images ?? (imageBase64 ? [{ base64: imageBase64, mimeType: mimeType ?? "image/jpeg" }] : []);

  if (!text && images.length === 0) {
    return NextResponse.json({ error: "text or images required" }, { status: 400 });
  }

  const anthropic = new Anthropic();
  const MODEL = "claude-haiku-4-5-20251001";

  const callClaude = traceable(
    (messages: Anthropic.MessageParam[]) =>
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    {
      name: "parse-recipe",
      run_type: "llm",
      metadata: {
        ls_model_name: MODEL,
        ls_provider: "anthropic",
        ls_model_type: "chat",
      },
    }
  );

  const userContent: Anthropic.MessageParam["content"] = [];

  if (images.length > 0) {
    for (const img of images) {
      const validMime = (img.mimeType === "image/png" || img.mimeType === "image/gif" || img.mimeType === "image/webp")
        ? img.mimeType
        : "image/jpeg";
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: validMime, data: img.base64 },
      });
    }
    const prompt = images.length > 1
      ? "Extract the recipe from these images. They show different pages of the same recipe — combine them into one complete recipe."
      : "Extract the recipe from this image.";
    userContent.push({ type: "text", text: prompt });
  } else {
    userContent.push({ type: "text", text: `Extract the recipe from this text:\n\n${text}` });
  }

  try {
    const message = await callClaude([{ role: "user", content: userContent }]);

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown code fences if the model wraps its output
    const jsonText = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/recipes/parse]", err);
    return NextResponse.json(
      { error: "Failed to parse recipe", detail: String(err) },
      { status: 500 }
    );
  }
}
