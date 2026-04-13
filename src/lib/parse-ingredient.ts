import { parseAmount } from "@/lib/parse-amount";

const UNITS = [
  "cups", "cup",
  "tablespoons", "tablespoon", "tbsp",
  "teaspoons", "teaspoon", "tsp",
  "ounces", "ounce", "oz",
  "pounds", "pound", "lbs", "lb",
  "kilograms", "kilogram", "kg",
  "grams", "gram", "g",
  "liters", "liter", "l",
  "ml",
  "cloves", "clove",
  "cans", "can",
  "packages", "package", "pkg",
  "pieces", "piece",
  "slices", "slice",
  "bunches", "bunch",
  "handfuls", "handful",
  "sprigs", "sprig",
  "sticks", "stick",
  "bottles", "bottle",
  "jars", "jar",
  "bags", "bag",
  "pinch", "dash",
];

// Sorted longest-first so "tablespoons" matches before "tablespoon"
const UNITS_SORTED = [...UNITS].sort((a, b) => b.length - a.length);
const UNIT_PATTERN = new RegExp(`^(${UNITS_SORTED.join("|")})(?:\\s|$)`, "i");

export interface ParsedIngredient {
  amount: number;
  amountDisplay: string;
  unit: string;
  name: string;
  original: string;
}

export function parseIngredientText(raw: string): ParsedIngredient {
  const s = raw.trim();
  if (!s) {
    return { amount: 0, amountDisplay: "", unit: "", name: "", original: s };
  }

  // Match leading number: mixed ("1 1/2"), fraction ("1/2"), or decimal/integer
  const numMatch = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*/);
  if (!numMatch) {
    return { amount: 0, amountDisplay: "", unit: "", name: s, original: s };
  }

  const amountStr = numMatch[1];
  const rest = s.slice(numMatch[0].length);
  const amount = parseAmount(amountStr);

  const unitMatch = rest.match(UNIT_PATTERN);
  if (unitMatch) {
    const unit = unitMatch[1];
    const name = rest.slice(unitMatch[0].length).trim();
    return { amount, amountDisplay: amountStr, unit, name: name || unit, original: s };
  }

  return { amount, amountDisplay: amountStr, unit: "", name: rest.trim() || amountStr, original: s };
}
