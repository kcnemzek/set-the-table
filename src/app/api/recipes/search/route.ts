import { NextRequest, NextResponse } from "next/server";
import { transformHit } from "@/lib/edamam-transform";
import { edamamFetch } from "@/lib/edamam-fetch";

export const dynamic = "force-dynamic";

const BASE = "https://api.edamam.com/api/recipes/v2";

export async function GET(request: NextRequest) {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    return NextResponse.json({ error: "API credentials not configured" }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const number = parseInt(searchParams.get("number") ?? "10", 10);
  const nextPageToken = searchParams.get("nextPageToken");

  const params = new URLSearchParams({
    type: "public",
    app_id: appId,
    app_key: appKey,
    from: "0",
    to: String(number),
  });

  if (nextPageToken) params.set("_cont", nextPageToken);

  const query = searchParams.get("query") ?? "dinner";
  params.set("q", query);

  const cuisine = searchParams.get("cuisine");
  if (cuisine) params.set("cuisineType", cuisine.toLowerCase());

  const diet = searchParams.get("diet");
  if (diet) params.set("diet", diet.toLowerCase());

  const type = searchParams.get("type");
  if (type) params.set("dishType", type);

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

    let responseNextPageToken: string | undefined;
    const nextHref: string | undefined = data._links?.next?.href;
    if (nextHref) {
      try {
        responseNextPageToken =
          new URL(nextHref).searchParams.get("_cont") ?? undefined;
      } catch {
        // ignore malformed URL
      }
    }

    return NextResponse.json({
      results: (data.hits ?? []).map(transformHit),
      totalResults: data.count ?? 0,
      nextPageToken: responseNextPageToken,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch recipes", detail: String(err) },
      { status: 502 }
    );
  }
}
