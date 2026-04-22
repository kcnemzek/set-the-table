import { test, expect } from "@playwright/test";

test.describe("Event planning", () => {
  test("can create a new event", async ({ page }) => {
    await page.goto("/event-planning");
    await expect(page).not.toHaveURL(/login/);

    await page.getByRole("button", { name: /new event/i }).click();

    const nameInput = page.getByPlaceholder(/event name/i);
    await nameInput.fill("Thanksgiving Dinner");
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText("Thanksgiving Dinner")).toBeVisible();
  });

  test("can open an event and add a dish", async ({ page }) => {
    await page.goto("/event-planning");

    // Create an event first
    await page.getByRole("button", { name: /new event/i }).click();
    await page.getByPlaceholder(/event name/i).fill("Dinner Party");
    await page.getByRole("button", { name: /create/i }).click();

    // Navigate into the event
    await page.getByText("Dinner Party").click();
    await expect(page.getByText("Dishes")).toBeVisible();

    // Add a dish
    await page.getByRole("button", { name: /add dish/i }).click();
    const dishInput = page.getByPlaceholder(/dish name/i);
    await dishInput.fill("Roast Chicken");
    await page.getByRole("button", { name: /add/i }).last().click();

    await expect(page.getByText("Roast Chicken")).toBeVisible();
  });

  test("can reorder dishes with drag handles visible", async ({ page }) => {
    await page.goto("/event-planning");

    // Create event with two dishes
    await page.getByRole("button", { name: /new event/i }).click();
    await page.getByPlaceholder(/event name/i).fill("Potluck");
    await page.getByRole("button", { name: /create/i }).click();
    await page.getByText("Potluck").click();

    // Add first dish
    await page.getByRole("button", { name: /add dish/i }).click();
    await page.getByPlaceholder(/dish name/i).fill("Salad");
    await page.getByRole("button", { name: /add/i }).last().click();

    // Add second dish
    await page.getByRole("button", { name: /add dish/i }).click();
    await page.getByPlaceholder(/dish name/i).fill("Pasta");
    await page.getByRole("button", { name: /add/i }).last().click();

    // Both dishes visible, drag handles present
    await expect(page.getByText("Salad")).toBeVisible();
    await expect(page.getByText("Pasta")).toBeVisible();
    const handles = page.getByLabel("Drag to reorder");
    await expect(handles.first()).toBeVisible();
  });

  test("can add a task to an event", async ({ page }) => {
    await page.goto("/event-planning");

    await page.getByRole("button", { name: /new event/i }).click();
    await page.getByPlaceholder(/event name/i).fill("Birthday Party");
    await page.getByRole("button", { name: /create/i }).click();
    await page.getByText("Birthday Party").click();

    await page.getByRole("button", { name: /add task/i }).click();
    await page.getByPlaceholder(/make turkey brine/i).fill("Order the cake");
    await page.getByRole("button", { name: /add task/i }).last().click();

    await expect(page.getByText("Order the cake")).toBeVisible();
  });
});
