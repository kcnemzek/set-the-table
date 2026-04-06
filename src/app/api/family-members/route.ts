import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { storeInviteToken } from "@/lib/invite-tokens";
import type { FamilyMember } from "@/types";

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function safeFilename(userId: string) {
  return userId.replace(/[^a-z0-9]/gi, "-");
}

async function readUserData(userId: string): Promise<Record<string, unknown>> {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<Record<string, unknown>>(`app-data:${userId}`)) ?? {};
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
    return {};
  }
}

async function writeUserData(userId: string, data: Record<string, unknown>) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`app-data:${userId}`, data);
    return;
  }
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `app-data-${safeFilename(userId)}.json`),
    JSON.stringify(data, null, 2)
  );
}

// ─── POST /api/family-members — add a family member ──────────────────────────

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const inviteToken = crypto.randomUUID();
  const member: FamilyMember = {
    id: crypto.randomUUID(),
    name: name.trim(),
    inviteToken,
  };

  await storeInviteToken(inviteToken, { userId, memberName: member.name });

  const data = await readUserData(userId);
  const existing = (data.familyMembers ?? []) as FamilyMember[];
  await writeUserData(userId, { ...data, familyMembers: [...existing, member] });

  return NextResponse.json({ member });
}
