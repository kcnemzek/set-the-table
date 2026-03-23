import type {
  AggregatedIngredient,
  ExtendedIngredient,
  GroceryListByAisle,
  RecipeDetail,
  ManualGroceryItem,
} from "@/types";

export function aggregateIngredients(
  recipes: RecipeDetail[],
  manualItems: ManualGroceryItem[]
): GroceryListByAisle {
  const allIngredients: ExtendedIngredient[] = recipes.flatMap(
    (r) => r.extendedIngredients ?? []
  );

  // Group by normalized name
  const byName = new Map<string, ExtendedIngredient[]>();
  for (const ing of allIngredients) {
    const key = (ing.nameClean ?? ing.name).toLowerCase().trim();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(ing);
  }

  const aggregated: AggregatedIngredient[] = [];

  for (const [, group] of byName) {
    const first = group[0];
    const aisle = first.aisle ?? "Miscellaneous";

    // Sum amounts per unit; keep separate entries for unit mismatches
    const byUnit = new Map<string, { amount: number; originals: string[] }>();
    for (const ing of group) {
      const unit = ing.unit.toLowerCase().trim();
      if (!byUnit.has(unit)) byUnit.set(unit, { amount: 0, originals: [] });
      const entry = byUnit.get(unit)!;
      entry.amount += ing.amount;
      entry.originals.push(ing.original);
    }

    for (const [unit, { amount, originals }] of byUnit) {
      aggregated.push({
        name: first.nameClean ?? first.name,
        totalAmount: parseFloat(amount.toFixed(2)),
        unit,
        aisle: normalizeAisle(aisle),
        originalLines: originals,
        checked: false,
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
