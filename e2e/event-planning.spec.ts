import { test, expect } from "@playwright/test";

const TEST_DATE = "2026-06-01";
const uid = () => Date.now().toString(36);

async function createEvent(page: any, name: string) {
  await page.getByRole("button", { name: /new event/i }).first().click();
  await page.getByPlaceholder(/thanksgiving 2025/i).fill(name);
  await page.locator('input[type="date"]').fill(TEST_DATE);
  await page.getByRole("button", { name: /create event/i }).click();
  // Creation navigates directly to the event detail page
  await expect(page).toHaveURL(/\/event-planning\/.+/);
}

async function addDish(page: any, dishName: string) {
  await page.getByRole("button", { name: "Add dish", exact: true }).click();
  await page.getByRole("button", { name: /note/i }).click();
  await page.getByPlaceholder(/easter brunch/i).fill(dishName);
  await page.getByRole("button", { name: /cancel/i }).locator("..").getByRole("button", { name: /^add$/i }).click();
}

test.describe("Event planning", () => {
  test("can create a new event", async ({ page }) => {
    await page.goto("/event-planning");
    await expect(page).not.toHaveURL(/login/);
    await createEvent(page, `Thanksgiving ${uid()}`);
  });

  test("can open an event and add a dish", async ({ page }) => {
    await page.goto("/event-planning");
    await createEvent(page, `Dinner Party ${uid()}`);
    // Already on the event detail page after creation
    await addDish(page, "Roast Chicken");
    await expect(page.getByText("Roast Chicken")).toBeVisible();
  });

  test("can reorder dishes with drag handles visible", async ({ page }) => {
    await page.goto("/event-planning");
    await createEvent(page, `Potluck ${uid()}`);

    await addDish(page, "Salad");
    await addDish(page, "Pasta");

    await expect(page.getByText("Salad")).toBeVisible();
    await expect(page.getByText("Pasta")).toBeVisible();
    const handles = page.getByLabel("Drag to reorder");
    await expect(handles.first()).toBeVisible();
  });

  test("can add a task to an event", async ({ page }) => {
    await page.goto("/event-planning");
    await createEvent(page, `Birthday Party ${uid()}`);

    await page.getByRole("button", { name: /add task/i }).click();
    await page.getByPlaceholder(/make turkey brine/i).fill("Order the cake");
    await page.getByRole("button", { name: /add task/i }).last().click();

    await expect(page.getByText("Order the cake")).toBeVisible();
  });
});
