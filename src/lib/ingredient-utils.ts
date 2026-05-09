import type {
  AggregatedIngredient,
  ExtendedIngredient,
  GroceryListByAisle,
  RecipeDetail,
  ManualGroceryItem,
} from "@/types";

export function aggregateIngredients(
  recipes: RecipeDetail[],
  manualItems: ManualGroceryItem[],
  groceryItemStores: Record<string, string> = {}
): GroceryListByAisle {
  const allIngredients: { ing: ExtendedIngredient; recipeTitle: string }[] = recipes.flatMap(
    (r) => (r.extendedIngredients ?? []).map((ing) => ({ ing, recipeTitle: r.title }))
  );

  // Group by normalized name
  const byName = new Map<string, { ing: ExtendedIngredient; recipeTitle: string }[]>();
  for (const item of allIngredients) {
    const key = (item.ing.nameClean ?? item.ing.name).toLowerCase().trim();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(item);
  }

  const aggregated: AggregatedIngredient[] = [];

  for (const [, group] of byName) {
    const first = group[0].ing;
    const aisle = first.aisle ?? "Miscellaneous";

    // Sum amounts per unit; keep separate entries for unit mismatches
    const byUnit = new Map<string, { amount: number; originals: string[]; recipes: Set<string> }>();
    for (const { ing, recipeTitle } of group) {
      const unit = ing.unit.toLowerCase().trim();
      if (!byUnit.has(unit)) byUnit.set(unit, { amount: 0, originals: [], recipes: new Set() });
      const entry = byUnit.get(unit)!;
      entry.amount += ing.amount;
      entry.originals.push(ing.original);
      entry.recipes.add(recipeTitle);
    }

    for (const [unit, { amount, originals, recipes }] of byUnit) {
      const itemAisle = normalizeAisle(aisle);
      const itemName = first.nameClean ?? first.name;
      const key = `${itemAisle}|${itemName.toLowerCase()}|${unit.toLowerCase()}`;
      aggregated.push({
        name: itemName,
        totalAmount: parseFloat(amount.toFixed(2)),
        unit,
        aisle: itemAisle,
        originalLines: originals,
        checked: false,
        recipes: Array.from(recipes),
        store: groceryItemStores[key],
      });
    }
  }

  // Group by aisle
  const byAisle: GroceryListByAisle = {};
  for (const item of aggregated) {
    if (!byAisle[item.aisle]) byAisle[item.aisle] = [];
    byAisle[item.aisle].push(item);
  }

  // Add manual items under their aisles
  for (const item of manualItems) {
    const aisle = normalizeAisle(item.aisle || "Miscellaneous");
    if (!byAisle[aisle]) byAisle[aisle] = [];
    byAisle[aisle].push({
      name: item.name,
      totalAmount: item.amount,
      unit: item.unit,
      aisle,
      originalLines: [],
      checked: item.checked,
      recipes: [],
      manualId: item.id,
      store: item.store,
      stapleId: item.stapleId,
    });
  }

  // Sort items within each aisle alphabetically
  for (const aisle of Object.keys(byAisle)) {
    byAisle[aisle].sort((a, b) => a.name.localeCompare(b.name));
  }

  return sortAisles(byAisle);
}

function normalizeAisle(aisle: string): string {
  return aisle.split(";")[0].trim() || "Miscellaneous";
}

function sortAisles(byAisle: GroceryListByAisle): GroceryListByAisle {
  const entries = Object.entries(byAisle);
  entries.sort(([a], [b]) => {
    if (a === "Miscellaneous") return 1;
    if (b === "Miscellaneous") return -1;
    return a.localeCompare(b);
  });
  return Object.fromEntries(entries);
}

/** Generate a stable key for checking off a grocery line item */
export function groceryItemKey(aisle: string, name: string, unit: string): string {
  return `${aisle}|${name.toLowerCase()}|${unit.toLowerCase()}`;
}
