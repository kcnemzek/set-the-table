import { test, expect } from "@playwright/test";

test.describe("Menu page", () => {
  test("loads and shows week navigation", async ({ page }) => {
    await page.goto("/menu");
    await expect(page).not.toHaveURL(/login/);
    // Bottom nav should be visible
    await expect(page.getByRole("link", { name: /menu/i }).first()).toBeVisible();
  });

  test("can add a text entry to a day", async ({ page }) => {
    await page.goto("/menu");

    // Open the add sheet for the first day card's + button
    const addButton = page.getByRole("button", { name: /add/i }).first();
    await addButton.click();

    // Type a custom note
    const noteTab = page.getByRole("button", { name: /note/i });
    await noteTab.click();

    const input = page.getByPlaceholder(/easter brunch/i);
    await input.fill("Leftover soup");
    await page.getByRole("button", { name: /cancel/i }).locator("..").getByRole("button", { name: /^add$/i }).click();

    await expect(page.getByText("Leftover soup").first()).toBeVisible();
  });
});
