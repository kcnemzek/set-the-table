import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readFamilyGroceries, writeFamilyGroceries } from "@/lib/invite-tokens";

// ─── GET — owner fetches all family-added grocery items ──────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await readFamilyGroceries(session.user.id);
  return NextResponse.json({ items });
}

// ─── DELETE — owner clears all family grocery items ──────────────────────────

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await writeFamilyGroceries(session.user.id, []);
  return NextResponse.json({ ok: true });
}
