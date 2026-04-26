import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getHousehold,
  saveHousehold,
  getUserHouseholdId,
  storePendingInvite,
  deletePendingInvite,
  deleteUserHouseholdId,
} from "@/lib/household";
import type { HouseholdRole } from "@/types";

// GET /api/household/members — list members and pending invites
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const householdId = await getUserHouseholdId(session.user.id);
  if (!householdId) return NextResponse.json({ members: [], pendingInvites: [] });
  const household = await getHousehold(householdId);
  if (!household) return NextResponse.json({ members: [], pendingInvites: [] });
  return NextResponse.json({
    members: household.members,
    pendingInvites: household.pendingInvites,
  });
}

// POST /api/household/members — invite someone by email
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const householdId = await getUserHouseholdId(userId);
  if (!householdId) {
    return NextResponse.json({ error: "Not in a household" }, { status: 400 });
  }

  const household = await getHousehold(householdId);
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 });
  }

  const me = household.members.find((m) => m.userId === userId);
  if (me?.role !== "executive-chef") {
    return NextResponse.json({ error: "Only the Executive Chef can invite members" }, { status: 403 });
  }

  const { email, role } = await request.json() as { email: string; role: HouseholdRole };
  if (!email?.trim() || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Already a member?
  if (household.members.some((m) => m.email.toLowerCase() === normalizedEmail)) {
    return NextResponse.json({ error: "This person is already a member" }, { status: 409 });
  }

  const invite = {
    email: normalizedEmail,
    role,
    invitedAt: new Date().toISOString(),
    invitedBy: me.name,
  };

  // Update household pendingInvites (replace if already invited)
  household.pendingInvites = household.pendingInvites.filter(
    (p) => p.email.toLowerCase() !== normalizedEmail
  );
  household.pendingInvites.push(invite);
  await saveHousehold(household);

  // Store KV lookup for signIn callback
  await storePendingInvite(normalizedEmail, {
    householdId,
    role,
    invitedAt: invite.invitedAt,
    invitedBy: me.name,
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/household/members — remove a member or revoke an invite
// Query params: ?userId=xxx  OR  ?email=xxx
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const householdId = await getUserHouseholdId(userId);
  if (!householdId) {
    return NextResponse.json({ error: "Not in a household" }, { status: 400 });
  }

  const household = await getHousehold(householdId);
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 });
  }

  const me = household.members.find((m) => m.userId === userId);
  if (me?.role !== "executive-chef") {
    return NextResponse.json({ error: "Only the Executive Chef can remove members" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");
  const targetEmail = searchParams.get("email");

  if (targetEmail) {
    household.pendingInvites = household.pendingInvites.filter(
      (p) => p.email.toLowerCase() !== targetEmail.toLowerCase()
    );
    await deletePendingInvite(targetEmail);
    await saveHousehold(household);
    return NextResponse.json({ ok: true });
  }

  if (targetUserId) {
    if (targetUserId === userId) {
      return NextResponse.json({ error: "Use DELETE /api/household to leave" }, { status: 400 });
    }
    household.members = household.members.filter((m) => m.userId !== targetUserId);
    await saveHousehold(household);
    await deleteUserHouseholdId(targetUserId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Provide userId or email" }, { status: 400 });
}
