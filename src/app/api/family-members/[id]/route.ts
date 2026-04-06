import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteInviteToken } from "@/lib/invite-tokens";
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

// ─── DELETE /api/family-members/[id] — remove a family member ────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const data = await readUserData(userId);
  const members = (data.familyMembers ?? []) as FamilyMember[];
  const member = members.find((m) => m.id === id);
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (member.inviteToken) {
    await deleteInviteToken(member.inviteToken);
  }

  await writeUserData(userId, {
    ...data,
    familyMembers: members.filter((m) => m.id !== id),
  });

  return NextResponse.json({ ok: true });
}
