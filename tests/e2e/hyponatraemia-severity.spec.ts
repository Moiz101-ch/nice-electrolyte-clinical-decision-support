import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("classifies supported sodium boundaries and fails closed outside exact source bands", async ({
  page,
}) => {
  await page.goto("/review/hyponatraemia/severity");

  await expect(page.getByRole("heading", { name: "Sodium severity review" })).toBeVisible();
  const input = page.getByRole("spinbutton", { name: /Latest sodium result/i });

  await input.fill("124.9");
  await expect(page.getByRole("heading", { name: "Severe hyponatraemia" })).toBeVisible();

  await input.fill("125");
  await expect(page.getByRole("heading", { name: "Moderate hyponatraemia" })).toBeVisible();

  await input.fill("129.5");
  await expect(
    page.getByRole("note", { name: /No exact source severity band matched/ }),
  ).toBeVisible();

  await input.fill("130");
  await expect(page.getByRole("heading", { name: "Mild hyponatraemia" })).toBeVisible();

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps the sodium severity review within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyponatraemia/severity");

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await expect(page.getByText("Boundary requires clinical review")).toBeVisible();
});
