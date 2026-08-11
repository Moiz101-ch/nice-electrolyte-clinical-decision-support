import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("presents a complete operational result without visible document references", async ({
  page,
}) => {
  await page.goto("/review/hyponatraemia/result");

  await expect(
    page.getByRole("heading", { level: 1, name: "Hyponatraemia operational result" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Severe hyponatraemia" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Immediate actions" })).toBeVisible();
  await expect(page.getByRole("alert", { name: /Maximum correction limit/ })).toContainText(
    "10 mmol/L in 24 hours",
  );
  await expect(page.getByRole("heading", { name: "Monitoring" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Next steps" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Escalation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SIADH-compatible pattern" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why this result was selected" })).toBeVisible();
  await expect(
    page.getByText(/YSTHFT-|UNVERIFIED-HYPONATRAEMIA|Registry ID|Page 1|\.pdf/i),
  ).toHaveCount(0);

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps the complete result readable within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyponatraemia/result");

  await expect(
    page.getByRole("heading", { level: 1, name: "Hyponatraemia operational result" }),
  ).toBeVisible();
  await expect(page.getByText("Symptomatic emergency management", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});

test("links to the result preview from both contributing workflow reviews", async ({ page }) => {
  await page.goto("/review/hyponatraemia/emergency-management");
  await page.getByRole("link", { name: /Result preview/ }).click();
  await expect(page).toHaveURL(/\/review\/hyponatraemia\/result$/);

  await page.goto("/review/hyponatraemia/classification");
  await expect(page.getByRole("link", { name: /Result preview/ })).toHaveAttribute(
    "href",
    "/review/hyponatraemia/result",
  );
});
