import type { Household, HouseholdRole } from "@/types";

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function keyToFilename(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "-");
}

async function kvGet<T>(key: string): Promise<T | null> {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return kv.get<T>(key);
  }
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const raw = await readFile(
      join(process.cwd(), "data", `${keyToFilename(key)}.json`),
      "utf-8"
    );
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
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
    join(dir, `${keyToFilename(key)}.json`),
    JSON.stringify(value, null, 2)
  );
}

async function kvDel(key: string): Promise<void> {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    await kv.del(key);
    return;
  }
  const { unlink } = await import("fs/promises");
  const { join } = await import("path");
  try {
    await unlink(join(process.cwd(), "data", `${keyToFilename(key)}.json`));
  } catch { /* already gone */ }
}

// ─── Household record ─────────────────────────────────────────────────────────

export async function getHousehold(householdId: string): Promise<Household | null> {
  return kvGet<Household>(`household:${householdId}`);
}

export async function saveHousehold(household: Household): Promise<void> {
  await kvSet(`household:${household.id}`, household);
}

// ─── User → Household lookup ──────────────────────────────────────────────────

export async function getUserHouseholdId(userId: string): Promise<string | null> {
  return kvGet<string>(`user-household:${userId}`);
}

export async function setUserHouseholdId(userId: string, householdId: string): Promise<void> {
  await kvSet(`user-household:${userId}`, householdId);
}

export async function deleteUserHouseholdId(userId: string): Promise<void> {
  await kvDel(`user-household:${userId}`);
}

// ─── Pending invites (by email) ───────────────────────────────────────────────

export interface PendingInviteRecord {
  householdId: string;
  role: HouseholdRole;
  invitedAt: string;
  invitedBy: string;
}

export async function storePendingInvite(email: string, record: PendingInviteRecord): Promise<void> {
  await kvSet(`pending-invite:${email.toLowerCase()}`, record);
}

export async function getPendingInvite(email: string): Promise<PendingInviteRecord | null> {
  return kvGet<PendingInviteRecord>(`pending-invite:${email.toLowerCase()}`);
}

export async function deletePendingInvite(email: string): Promise<void> {
  await kvDel(`pending-invite:${email.toLowerCase()}`);
}

// ─── Data key resolution ──────────────────────────────────────────────────────

export async function resolveDataKey(userId: string): Promise<string> {
  const householdId = await getUserHouseholdId(userId);
  if (householdId) return `household-data:${householdId}`;
  return `app-data:${userId}`;
}
