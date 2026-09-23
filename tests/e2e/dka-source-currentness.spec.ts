import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_DKA_PREVIEW !== "1", "Detailed DKA review is development-only.");

test("opens the locked DKA module as a source-currentness review", async ({ page }) => {
  await page.goto("/review/dka/source-currentness");

  await expect(page).toHaveURL(/\/review\/dka\/source-currentness$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "DKA source-currentness gate" }),
  ).toBeVisible();
  await expect(
    page.getByRole("alert", { name: /DKA calculator activation blocked/i }),
  ).toBeVisible();
  await expect(page.getByText("April 2021", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Step \d+$/)).toHaveCount(10);
  await expect(page.getByText("Conflict blocks rule")).toBeVisible();

  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /approve|calculate|start/i })).toHaveCount(0);
  await expect(page.getByText("YTH-DKA-V9-2019")).toHaveCount(0);
  await expect(page.getByText(/page \d+/i)).toHaveCount(0);

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps the DKA source review readable at mobile width", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/dka/source-currentness");

  await expect(
    page.getByRole("heading", { level: 1, name: "DKA source-currentness gate" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Planned tools" })).toBeVisible();
  await expect(page.getByText("Initial assessment", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
