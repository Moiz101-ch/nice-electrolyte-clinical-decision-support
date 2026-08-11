import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("renders an accessible and interactive pathway UI framework", async ({ page }) => {
  await page.goto("/review/pathway-ui");

  await expect(page.getByRole("heading", { name: "Shared pathway UI framework" })).toBeVisible();
  await expect(page.getByText("UI review only — no clinical output")).toBeVisible();

  const numericInput = page.getByRole("spinbutton", { name: /Example laboratory result/i });
  await numericInput.fill("125.6");
  await expect(numericInput).toHaveValue("125.6");

  const alternateContext = page.getByRole("radio", { name: /Context option A/ });
  await page.getByText("Context option A", { exact: true }).click();
  await expect(alternateContext).toBeChecked();

  const urgentFeature = page.getByRole("checkbox", { name: "Reduced consciousness" });
  await urgentFeature.check();
  await expect(urgentFeature).toBeChecked();

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps the pathway UI framework within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/pathway-ui");

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await expect(page.getByRole("heading", { name: "Structured result sections" })).toBeVisible();
});
