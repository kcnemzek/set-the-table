import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { storeInviteToken } from "@/lib/invite-tokens";
import {
  resolveDataKey,
  getUserHouseholdId,
  getPendingInvite,
  deletePendingInvite,
  getHousehold,
  saveHousehold,
  setUserHouseholdId,
} from "@/lib/household";
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
  stores: [],
  eventPlans: [],
  menuDayMeta: {},
  staples: [],
  pantry: [],
};

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// For local dev: map KV key to a safe filename (matches household.ts keyToFilename)
function keyToFilename(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "-");
}

async function readData(dataKey: string) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<object>(dataKey)) ?? EMPTY;
  }
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const raw = await readFile(
      join(process.cwd(), "data", `${keyToFilename(dataKey)}.json`),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return EMPTY;
  }
}

async function writeData(dataKey: string, body: unknown) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(dataKey, body);
    return;
  }
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${keyToFilename(dataKey)}.json`),
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

async function resolveAnyPendingInvite(userId: string, email: string, name: string) {
  const existingHouseholdId = await getUserHouseholdId(userId);
  if (existingHouseholdId) return;
  const invite = await getPendingInvite(email);
  if (!invite) return;
  const household = await getHousehold(invite.householdId);
  if (!household) return;
  if (household.members.some((m) => m.userId === userId)) return;
  household.members.push({
    userId,
    email,
    name,
    role: invite.role,
    joinedAt: new Date().toISOString(),
  });
  household.pendingInvites = household.pendingInvites.filter(
    (p) => p.email.toLowerCase() !== email.toLowerCase()
  );
  await saveHousehold(household);
  await setUserHouseholdId(userId, invite.householdId);
  await deletePendingInvite(email);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.email) {
    await resolveAnyPendingInvite(
      session.user.id,
      session.user.email,
      session.user.name ?? session.user.email
    );
  }
  try {
    const dataKey = await resolveDataKey(session.user.id);
    let data = await readData(dataKey) as Record<string, unknown>;
    const { migrated, data: migratedData } = await migrateFamilyMembers(session.user.id, data);
    if (migrated) {
      data = migratedData;
      await writeData(dataKey, data);
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
    const dataKey = await resolveDataKey(session.user.id);
    const body = await request.json();
    await writeData(dataKey, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
