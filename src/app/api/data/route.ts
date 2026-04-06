import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { storeInviteToken } from "@/lib/invite-tokens";
import type { FamilyMember } from "@/types";

const EMPTY = {
  menu: {},
  favorites: [],
  dislikedRecipes: [],
  customRecipes: [],
  manualGroceryItems: [],
  groceryChecked: {},
  familyMembers: [],
  savedMenus: [],
  tips: [],
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

/** Migrate string[] familyMembers to FamilyMember[] in-place. Returns true if migration happened. */
async function migrateFamilyMembers(
  userId: string,
  data: Record<string, unknown>
): Promise<{ migrated: boolean; data: Record<string, unknown> }> {
  const raw = data.familyMembers;
  if (!Array.isArray(raw) || raw.length === 0 || typeof raw[0] !== "string") {
    return { migrated: false, data };
  }
  const upgraded: FamilyMember[] = await Promise.all(
    (raw as string[]).map(async (name) => {
      const inviteToken = crypto.randomUUID();
      await storeInviteToken(inviteToken, { userId, memberName: name });
      return { id: crypto.randomUUID(), name, inviteToken };
    })
  );
  return { migrated: true, data: { ...data, familyMembers: upgraded } };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let data = await readData(session.user.id) as Record<string, unknown>;
    const { migrated, data: migratedData } = await migrateFamilyMembers(session.user.id, data);
    if (migrated) {
      data = migratedData;
      await writeData(session.user.id, data);
    }
    return NextResponse.json(data);
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
