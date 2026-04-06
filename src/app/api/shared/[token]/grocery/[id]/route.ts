import { NextResponse } from "next/server";
import { resolveInviteToken, readFamilyGroceries, writeFamilyGroceries } from "@/lib/invite-tokens";

// ─── DELETE — family member removes their own grocery item ───────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const { token, id } = await params;
  const record = await resolveInviteToken(token);
  if (!record) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const items = await readFamilyGroceries(record.userId);
  const item = items.find((i) => i.id === id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Only allow deleting own items
  if (item.addedBy !== record.memberName) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await writeFamilyGroceries(
    record.userId,
    items.filter((i) => i.id !== id)
  );
  return NextResponse.json({ ok: true });
}
