import { NextRequest, NextResponse } from "next/server";
import { transformHit } from "@/lib/edamam-transform";
import { edamamFetch } from "@/lib/edamam-fetch";

export const dynamic = "force-dynamic";

const BASE = "https://api.edamam.com/api/recipes/v2";

const GENERATE_QUERIES = [
  "chicken", "pasta", "salmon", "beef", "vegetarian",
  "soup", "salad", "tacos", "stir fry", "curry",
  "pork", "shrimp", "mushroom", "lentil", "noodles",
];

export async function GET(request: NextRequest) {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    return NextResponse.json({ error: "API credentials not configured" }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const disliked = searchParams.get("disliked")?.split(",").filter(Boolean) ?? [];

  // Pick a random query to get variety
  const query = GENERATE_QUERIES[Math.floor(Math.random() * GENERATE_QUERIES.length)];
  const offset = Math.floor(Math.random() * 20); // randomise starting point for variety

  const params = new URLSearchParams({
    type: "public",
    app_id: appId,
    app_key: appKey,
    q: query,
    from: String(offset),
    to: String(offset + 20), // fetch more so we can filter disliked
  });

  try {
    const res = await edamamFetch(`${BASE}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Edamam error: ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const all = (data.hits ?? []).map(transformHit);
    const filtered = all.filter((r: { id: string }) => !disliked.includes(r.id));
    const results = filtered.slice(0, 10);

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate recipes", detail: String(err) },
      { status: 502 }
    );
  }
}
