import { NextResponse } from "next/server";

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function safeFilename(userId: string) {
  return userId.replace(/[^a-z0-9]/gi, "-");
}

async function resolveToken(token: string): Promise<string | null> {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return kv.get<string>(`share-token:${token}`);
  }
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const raw = await readFile(join(process.cwd(), "data", "share-tokens.json"), "utf-8");
    const tokens = JSON.parse(raw) as Record<string, string>;
    return tokens[token] ?? null;
  } catch {
    return null;
  }
}

async function readUserData(userId: string) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return kv.get<Record<string, unknown>>(`app-data:${userId}`);
  }
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const raw = await readFile(
      join(process.cwd(), "data", `app-data-${safeFilename(userId)}.json`),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const userId = await resolveToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }
  const data = await readUserData(userId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Only expose what the family view needs
  return NextResponse.json({
    menu: data.menu ?? {},
    customRecipes: data.customRecipes ?? [],
    familyMembers: data.familyMembers ?? [],
  });
}
