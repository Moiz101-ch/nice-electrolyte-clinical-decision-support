import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("classifies a euvolaemic hypotonic SIADH-compatible pattern accessibly", async ({ page }) => {
  await page.goto("/review/hyponatraemia/classification");

  await expect(
    page.getByRole("heading", { level: 1, name: "Urine and osmolality classification" }),
  ).toBeVisible();
  await page.getByText("Yes - results available", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Serum osmolality/ }).fill("270");
  await page.getByText("Euvolaemic", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Urine osmolality/ }).fill("120");
  await page.getByRole("spinbutton", { name: /Urine sodium/ }).fill("40.1");

  await expect(page.getByRole("heading", { name: "SIADH-compatible pattern" })).toBeVisible();
  await expect(page.getByRole("note", { name: /SIADH management is not available/ })).toBeVisible();
  await expect(page.getByText(/Page 1|Registry ID|UNVERIFIED-HYPONATRAEMIA/)).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("handles unavailable results and explicit threshold gaps without inferring a cause", async ({
  page,
}) => {
  await page.goto("/review/hyponatraemia/classification");

  await page.getByText("No - not available", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Urine results unavailable" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open emergency review/ })).toBeVisible();

  await page.getByText("Yes - results available", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Serum osmolality/ }).fill("275");
  await expect(
    page.getByRole("note", { name: /Classification requires clinical review/ }),
  ).toContainText("Exact equality at 275 or 295 is not assigned automatically");
  await expect(page.getByText("Associated cause categories")).toHaveCount(0);
});

test("resets hidden urine values and remains within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyponatraemia/classification");

  await page.getByText("Yes - results available", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Serum osmolality/ }).fill("270");
  await page.getByText("Euvolaemic", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Urine osmolality/ }).fill("120");
  await page.getByRole("spinbutton", { name: /Urine sodium/ }).fill("60");
  await expect(page.getByRole("heading", { name: "SIADH-compatible pattern" })).toBeVisible();

  await page.getByText("Hypovolaemic", { exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: /Urine osmolality/ })).toHaveCount(0);
  await expect(page.getByRole("spinbutton", { name: /Urine sodium/ })).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
