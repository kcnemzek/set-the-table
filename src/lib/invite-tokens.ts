const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// ─── Invite token records ─────────────────────────────────────────────────────

export interface InviteTokenRecord {
  userId: string;
  memberName: string;
}

async function readInviteTokenFile(): Promise<Record<string, InviteTokenRecord>> {
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const raw = await readFile(join(process.cwd(), "data", "invite-tokens.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeInviteTokenFile(tokens: Record<string, InviteTokenRecord>) {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "invite-tokens.json"), JSON.stringify(tokens, null, 2));
}

export async function storeInviteToken(token: string, record: InviteTokenRecord) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`invite-token:${token}`, record);
    return;
  }
  const tokens = await readInviteTokenFile();
  tokens[token] = record;
  await writeInviteTokenFile(tokens);
}

export async function deleteInviteToken(token: string) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    await kv.del(`invite-token:${token}`);
    return;
  }
  const tokens = await readInviteTokenFile();
  delete tokens[token];
  await writeInviteTokenFile(tokens);
}

export async function resolveInviteToken(token: string): Promise<InviteTokenRecord | null> {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return kv.get<InviteTokenRecord>(`invite-token:${token}`);
  }
  const tokens = await readInviteTokenFile();
  return tokens[token] ?? null;
}

