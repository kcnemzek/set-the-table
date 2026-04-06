import { NextResponse } from "next/server";
import { resolveInviteToken } from "@/lib/invite-tokens";

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function safeFilename(userId: string) {
  return userId.replace(/[^a-z0-9]/gi, "-");
}

async function resolveShareToken(token: string): Promise<string | null> {
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

  // Try invite token first (per-member link)
  const inviteRecord = await resolveInviteToken(token);
  if (inviteRecord) {
    const data = await readUserData(inviteRecord.userId);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      type: "invite",
      memberName: inviteRecord.memberName,
      menu: data.menu ?? {},
      customRecipes: data.customRecipes ?? [],
    });
  }

  // Fall back to shared read-only link
  const userId = await resolveShareToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }
  const data = await readUserData(userId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    type: "shared",
    menu: data.menu ?? {},
    customRecipes: data.customRecipes ?? [],
    familyMembers: (data.familyMembers ?? []).map((m: unknown) =>
      typeof m === "string" ? m : (m as { name: string }).name
    ),
  });
}
