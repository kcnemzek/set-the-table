import { NextResponse } from "next/server";
import { auth } from "@/auth";

const EMPTY = {
  menu: {},
  favorites: [],
  dislikedRecipes: [],
  customRecipes: [],
  manualGroceryItems: [],
  groceryChecked: {},
};

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function userKey(userId: string): string {
  return `app-data:${userId}`;
}

// Sanitize user ID for use as a filename (for local dev fallback)
function safeFilename(userId: string): string {
  return userId.replace(/[^a-z0-9]/gi, "-");
}

async function readData(userId: string) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<object>(userKey(userId))) ?? EMPTY;
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
    return EMPTY;
  }
}

async function writeData(userId: string, body: unknown) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(userKey(userId), body);
    return;
  }
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `app-data-${safeFilename(userId)}.json`),
    JSON.stringify(body, null, 2)
  );
}

export async function GET() {
  console.log("[api/data GET] invoked, hasKV:", hasKV);
  const session = await auth();
  console.log("[api/data GET] session:", session?.user?.id ?? "null");
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await readData(session.user.id));
  } catch {
    return NextResponse.json(EMPTY);
  }
}

export async function POST(request: Request) {
  console.log("[api/data POST] invoked, hasKV:", hasKV);
  const session = await auth();
  console.log("[api/data POST] session:", session?.user?.id ?? "null");
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    await writeData(session.user.id, body);
    console.log("[api/data POST] write ok for", session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.log("[api/data POST] write error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
