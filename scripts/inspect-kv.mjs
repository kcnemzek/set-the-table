// inspect-kv.mjs
// Usage: node --env-file=.env.local scripts/inspect-kv.mjs

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.error("Missing KV_REST_API_URL or KV_REST_API_TOKEN in .env.local");
  process.exit(1);
}

async function kvGet(key) {
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.result ? JSON.parse(json.result) : null;
}

async function kvKeys(pattern) {
  const res = await fetch(`${url}/keys/${encodeURIComponent(pattern)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.result ?? [];
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const PRUNE_DAYS = 30;
const pruneDate = new Date(today);
pruneDate.setDate(pruneDate.getDate() - PRUNE_DAYS);

console.log(`\n📦 Fetching all app-data keys from KV...\n`);
const keys = await kvKeys("app-data:*");
console.log(`Found ${keys.length} user(s)\n`);

for (const key of keys) {
  console.log(`\n─── ${key} ───`);
  const data = await kvGet(key);
  if (!data) { console.log("  (empty)"); continue; }

  const menu = data.menu ?? {};
  const dates = Object.keys(menu).sort();

  if (dates.length === 0) {
    console.log("  No menu entries.");
    continue;
  }

  const oldest = dates[0];
  const newest = dates[dates.length - 1];
  const totalEntries = dates.reduce((sum, d) => sum + (menu[d]?.length ?? 0), 0);

  const surviving = dates.filter((d) => new Date(d + "T00:00:00") >= pruneDate);
  const pruned = dates.filter((d) => new Date(d + "T00:00:00") < pruneDate);
  const survivingEntries = surviving.reduce((sum, d) => sum + (menu[d]?.length ?? 0), 0);

  console.log(`  Date range:      ${oldest} → ${newest}`);
  console.log(`  Total dates:     ${dates.length}`);
  console.log(`  Total entries:   ${totalEntries}`);
  console.log(`  Favorites:       ${(data.favorites ?? []).length}`);
  console.log(`  Custom recipes:  ${(data.customRecipes ?? []).length}`);
  console.log(`  Saved menus:     ${(data.savedMenus ?? []).length}`);
  console.log(`\n  ── After 30-day prune ──`);
  console.log(`  Dates kept:      ${surviving.length}  (${pruned.length} removed)`);
  console.log(`  Entries kept:    ${survivingEntries}  (${totalEntries - survivingEntries} removed)`);

  console.log(`\n  ── All dates ──`);
  for (const d of dates) {
    const entries = menu[d] ?? [];
    const isPruned = new Date(d + "T00:00:00") < pruneDate;
    const flag = isPruned ? "✂️ " : "✅ ";
    const types = entries.map((e) => e.recipeTitle ?? e.text ?? e.type).join(", ");
    console.log(`  ${flag} ${d}  (${entries.length} entries)  ${types}`);
  }
}

console.log("\nDone.\n");
