import { NextResponse } from "next/server";
import { auth } from "@/auth";

const EMPTY = {
  menu: {},
  favorites: [],
  dislikedRecipes: [],
  customRecipes: [],
  manualGroceryItems: [],
  groceryChecked: {},
  familyMembers: [],
  savedMenus: [],
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
  const session = await auth();
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    await writeData(session.user.id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
