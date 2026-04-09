import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readFamilyGroceries, writeFamilyGroceries } from "@/lib/invite-tokens";

// ─── PATCH — owner toggles checked state ─────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const items = await readFamilyGroceries(session.user.id);
  await writeFamilyGroceries(
    session.user.id,
    items.map((i) => {
      if (i.id !== id) return i;
      const updated = { ...i };
      if ("checked" in body) updated.checked = Boolean(body.checked);
      if ("store" in body) updated.store = body.store ?? undefined;
      return updated;
    })
  );
  return NextResponse.json({ ok: true });
}

// ─── DELETE — owner removes a single family grocery item ─────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const items = await readFamilyGroceries(session.user.id);
  await writeFamilyGroceries(
    session.user.id,
    items.filter((i) => i.id !== id)
  );
  return NextResponse.json({ ok: true });
}
