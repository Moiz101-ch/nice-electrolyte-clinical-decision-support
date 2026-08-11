import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("runs the high-risk emergency response branch with source-traceable monitoring", async ({
  page,
}) => {
  await page.goto("/review/hyponatraemia/emergency-management");

  await expect(
    page.getByRole("heading", { level: 1, name: "Hyponatraemia emergency management" }),
  ).toBeVisible();
  await expect(page.getByRole("alert", { name: /Maximum correction limit/ })).toContainText(
    "10 mmol/L in 24 hours",
  );
  await expect(page.getByText(/150 mL of 2.7% hypertonic saline/)).toBeVisible();

  await page.getByText("High risk confirmed", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "High-risk ODS monitoring" })).toBeVisible();
  await expect(page.getByText("Hourly sodium monitoring")).toBeVisible();

  await page.getByText("No symptomatic improvement", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Sodium change at 4 hours/ }).fill("3.9");
  await expect(page.getByRole("heading", { name: "Repeat-dose branch reached" })).toBeVisible();
  await expect(page.getByText(/Repeat 150 mL of 2.7% hypertonic saline/)).toBeVisible();

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("fails closed at the unstated boundary and resets downstream response data", async ({
  page,
}) => {
  await page.goto("/review/hyponatraemia/emergency-management");

  await page.getByText("High risk not confirmed", { exact: true }).click();
  await page.getByText("No symptomatic improvement", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Sodium change at 4 hours/ }).fill("4");
  await expect(
    page.getByRole("note", { name: /No explicit source response branch/ }),
  ).toBeVisible();

  await page.getByText("High risk confirmed", { exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: /Sodium change at 4 hours/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Confirm clinical response" })).toBeVisible();
  await page.getByText("Symptoms improved", { exact: true }).click();
  await expect(
    page.getByText("Diagnose and manage the cause with consultant review."),
  ).toBeVisible();
});

test("keeps emergency management readable within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyponatraemia/emergency-management");
  await expect(
    page.getByRole("heading", { level: 1, name: "Hyponatraemia emergency management" }),
  ).toBeVisible();
  await page.getByText("High risk not confirmed", { exact: true }).click();

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await expect(page.getByText("Has there been symptomatic improvement?")).toBeVisible();
});
