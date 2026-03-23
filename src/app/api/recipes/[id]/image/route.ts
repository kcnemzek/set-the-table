import { NextRequest, NextResponse } from "next/server";
import { edamamFetch } from "@/lib/edamam-fetch";

export const revalidate = 86400;

const BASE = "https://api.edamam.com/api/recipes/v2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const url = `${BASE}/${id}?type=public&app_id=${appId}&app_key=${appKey}`;
    const res = await edamamFetch(url);
    if (!res.ok) return new NextResponse(null, { status: 404 });

    const data = await res.json();
    const recipe = data.recipe ?? data;
    const imageUrl =
      recipe.images?.REGULAR?.url ?? recipe.images?.SMALL?.url ?? recipe.image;

    if (!imageUrl) return new NextResponse(null, { status: 404 });

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return new NextResponse(null, { status: 404 });

    const buffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
