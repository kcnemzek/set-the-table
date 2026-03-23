import { NextRequest, NextResponse } from "next/server";
import { transformRecipe } from "@/lib/edamam-transform";
import { edamamFetch } from "@/lib/edamam-fetch";

export const revalidate = 3600;

const BASE = "https://api.edamam.com/api/recipes/v2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    return NextResponse.json({ error: "API credentials not configured" }, { status: 500 });
  }

  const url = `${BASE}/${id}?type=public&app_id=${appId}&app_key=${appKey}`;

  try {
    const res = await edamamFetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Edamam error: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(transformRecipe(data.recipe ?? data));
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch recipe", detail: String(err) },
      { status: 502 }
    );
  }
}
