import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_DKA_PREVIEW !== "1", "Detailed DKA review is development-only.");

test("opens the source-gated DKA calculator foundation", async ({ page }) => {
  await page.goto("/review/dka/source-currentness");
  await page.getByRole("link", { name: "Review calculator foundation" }).click();

  await expect(page).toHaveURL(/\/review\/dka\/calculator$/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "DKA calculator foundation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("alert", { name: /Clinical execution remains locked/i }),
  ).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(10);

  await page.getByRole("tab", { name: "Step 4" }).click();
  await expect(
    page.getByRole("heading", { name: "Start fixed-rate IV insulin infusion" }),
  ).toBeVisible();
  await expect(page.getByText("Initial insulin infusion rate")).toBeVisible();

  await page.getByRole("tab", { name: "Step 9" }).click();
  await expect(page.getByText("DKA resolution")).toBeVisible();
  await expect(page.getByText("Conflict")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Step 10" })).toHaveAttribute("aria-selected", "true");

  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText("YTH-DKA-V9-2019")).toHaveCount(0);
  await expect(page.getByText(/page \d+/i)).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps stage navigation usable at mobile width", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/dka/calculator");

  await page.getByRole("tab", { name: "Step 10" }).click();
  await expect(
    page.getByRole("heading", { name: "Conversion to subcutaneous insulin" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Source-currentness gate" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
