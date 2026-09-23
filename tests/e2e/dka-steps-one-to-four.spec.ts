import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_DKA_PREVIEW !== "1", "Detailed DKA review is development-only.");

test("reviews DKA Steps 1–4 using synthetic cases only", async ({ page }) => {
  await page.goto("/review/dka/calculator");
  await page.getByRole("link", { name: "Review Steps 1–4" }).click();

  await expect(page).toHaveURL(/\/review\/dka\/steps-one-to-four$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: "DKA Steps 1–4" })).toBeVisible();
  await expect(page.getByRole("alert", { name: /Technical preview only/i })).toBeVisible();

  await page.getByRole("button", { name: /Step 4/i }).click();
  await expect(page.getByRole("heading", { name: "Calculation audit" })).toBeVisible();
  await expect(page.getByText("7.2 units/hour")).toHaveCount(2);

  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("pressure-recovered");
  await page.getByRole("button", { name: /Step 4/i }).click();
  await expect(page.getByText("15 units/hour", { exact: true })).toBeVisible();
  await expect(page.getByText(/Limit applied/)).toBeVisible();

  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("pressure-boundary");
  await page.getByRole("button", { name: /Step 3/i }).click();
  await expect(page.getByText(/Repeat pressure boundary is unresolved/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Calculation audit" })).toHaveCount(0);

  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText("YTH-DKA-V9-2019")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps the DKA technical review usable on mobile", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/dka/steps-one-to-four");

  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("acid-base-unknown");
  await page.getByRole("button", { name: /Step 2/i }).click();
  await expect(page.getByText("Diagnosis cannot be confirmed")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
