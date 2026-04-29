import { getRecipeEmoji } from "@/lib/recipe-emoji";
import type { CustomRecipe } from "@/types";

export function formatRecipeText(recipe: CustomRecipe): string {
  const emoji = getRecipeEmoji(recipe.title, recipe.category, recipe.emoji);
  const lines: string[] = [];
  lines.push(`${emoji} ${recipe.title}`);
  if (recipe.servings > 0) lines.push(`Serves ${recipe.servings}`);
  if (recipe.extendedIngredients.length > 0) {
    lines.push("", "INGREDIENTS");
    recipe.extendedIngredients.forEach((i) => lines.push(`• ${i.original}`));
  }
  if (recipe.directions?.trim()) {
    lines.push("", "DIRECTIONS");
    lines.push(recipe.directions.trim());
  }
  if (recipe.url?.trim()) {
    lines.push("", recipe.url.trim());
  }
  lines.push("", "Dinner is set. Shared via SetTheTable.");
  return lines.join("\n");
}

export async function shareRecipe(recipe: CustomRecipe): Promise<boolean> {
  const text = formatRecipeText(recipe);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: recipe.title, text });
      return false; // no "copied" feedback needed
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(text);
  return true; // show "Copied!" feedback
}
