import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getHousehold,
  saveHousehold,
  getUserHouseholdId,
  setUserHouseholdId,
  deleteUserHouseholdId,
} from "@/lib/household";
import type { Household } from "@/types";

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function readRawData(key: string) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<object>(key)) ?? null;
  }
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const raw = await readFile(
      join(process.cwd(), "data", `${key.replace(/[^a-z0-9]/gi, "-")}.json`),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeRawData(key: string, value: unknown) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value);
    return;
  }
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${key.replace(/[^a-z0-9]/gi, "-")}.json`),
    JSON.stringify(value, null, 2)
  );
}

// GET /api/household — return the current user's household (or null)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const householdId = await getUserHouseholdId(session.user.id);
  if (!householdId) return NextResponse.json(null);
  const household = await getHousehold(householdId);
  return NextResponse.json(household);
}

// POST /api/household — create a new household
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getUserHouseholdId(session.user.id);
  if (existing) {
    return NextResponse.json({ error: "Already in a household" }, { status: 409 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const householdId = crypto.randomUUID();
  const household: Household = {
    id: householdId,
    name: name.trim(),
    members: [
      {
        userId: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? session.user.email ?? "Chef",
        role: "executive-chef",
        joinedAt: new Date().toISOString(),
      },
    ],
    pendingInvites: [],
    createdAt: new Date().toISOString(),
    createdBy: session.user.id,
  };

  // Copy existing solo user data to household key
  const soloKey = `app-data:${session.user.id}`;
  const soloData = await readRawData(soloKey);
  if (soloData) {
    await writeRawData(`household-data:${householdId}`, soloData);
  }

  await saveHousehold(household);
  await setUserHouseholdId(session.user.id, householdId);

  return NextResponse.json(household);
}

// DELETE /api/household — leave the household
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const householdId = await getUserHouseholdId(userId);
  if (!householdId) {
    return NextResponse.json({ error: "Not in a household" }, { status: 404 });
  }

  const household = await getHousehold(householdId);
  if (!household) {
    await deleteUserHouseholdId(userId);
    return NextResponse.json({ ok: true });
  }

  const otherChefs = household.members.filter(
    (m) => m.role === "executive-chef" && m.userId !== userId
  );
  const otherMembers = household.members.filter((m) => m.userId !== userId);

  const member = household.members.find((m) => m.userId === userId);
  if (member?.role === "executive-chef" && otherMembers.length > 0 && otherChefs.length === 0) {
    return NextResponse.json(
      { error: "Promote another member to Executive Chef before leaving" },
      { status: 400 }
    );
  }

  if (otherMembers.length === 0) {
    const householdData = await readRawData(`household-data:${householdId}`);
    if (householdData) {
      await writeRawData(`app-data:${userId}`, householdData);
    }
  }

  household.members = household.members.filter((m) => m.userId !== userId);
  await saveHousehold(household);
  await deleteUserHouseholdId(userId);

  return NextResponse.json({ ok: true });
}
