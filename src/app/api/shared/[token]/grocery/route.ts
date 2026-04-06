import { NextResponse } from "next/server";
import { resolveInviteToken, readFamilyGroceries, writeFamilyGroceries } from "@/lib/invite-tokens";
import type { FamilyGroceryItem } from "@/types";

// ─── GET — family member fetches the current grocery list ────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const record = await resolveInviteToken(token);
  if (!record) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }
  const items = await readFamilyGroceries(record.userId);
  return NextResponse.json({ items });
}

// ─── POST — family member adds a grocery item ────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const record = await resolveInviteToken(token);
  if (!record) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const item: FamilyGroceryItem = {
    id: crypto.randomUUID(),
    name,
    addedBy: record.memberName,
    addedAt: new Date().toISOString(),
    checked: false,
  };

  const existing = await readFamilyGroceries(record.userId);
  await writeFamilyGroceries(record.userId, [...existing, item]);

  return NextResponse.json({ item });
}
