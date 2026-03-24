import { NextResponse } from "next/server";
import { auth } from "@/auth";

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function tokenKey(token: string) {
  return `share-token:${token}`;
}
function userShareKey(userId: string) {
  return `share-user:${userId}`;
}
function safeFilename(userId: string) {
  return userId.replace(/[^a-z0-9]/gi, "-");
}

async function readShareTokens(): Promise<Record<string, string>> {
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const raw = await readFile(join(process.cwd(), "data", "share-tokens.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeShareTokens(tokens: Record<string, string>) {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "share-tokens.json"), JSON.stringify(tokens, null, 2));
}

async function getUserToken(userId: string): Promise<string | null> {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    return kv.get<string>(userShareKey(userId));
  }
  const tokens = await readShareTokens();
  return Object.entries(tokens).find(([, uid]) => uid === userId)?.[0] ?? null;
}

async function saveToken(userId: string, token: string, oldToken?: string) {
  if (hasKV) {
    const { kv } = await import("@vercel/kv");
    if (oldToken) await kv.del(tokenKey(oldToken));
    await kv.set(tokenKey(token), userId);
    await kv.set(userShareKey(userId), token);
    return;
  }
  const tokens = await readShareTokens();
  if (oldToken) delete tokens[oldToken];
  tokens[token] = userId;
  await writeShareTokens(tokens);

  // Also persist shareToken in the user data file so it survives export
  const { readFile, writeFile } = await import("fs/promises");
  const { join } = await import("path");
  const dataPath = join(process.cwd(), "data", `app-data-${safeFilename(userId)}.json`);
  try {
    const raw = await readFile(dataPath, "utf-8");
    const data = JSON.parse(raw);
    await writeFile(dataPath, JSON.stringify({ ...data, shareToken: token }, null, 2));
  } catch { /* file may not exist yet */ }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  let token = await getUserToken(userId);
  if (!token) {
    token = crypto.randomUUID();
    await saveToken(userId, token);
  }
  return NextResponse.json({ token });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const oldToken = (await getUserToken(userId)) ?? undefined;
  const newToken = crypto.randomUUID();
  await saveToken(userId, newToken, oldToken);
  return NextResponse.json({ token: newToken });
}
