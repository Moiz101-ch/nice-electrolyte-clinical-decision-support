import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("classifies potassium boundaries and applies source-supported initial checks", async ({
  page,
}) => {
  await page.goto("/review/hyperkalaemia/severity");

  await expect(page.getByRole("heading", { name: "Potassium severity review" })).toBeVisible();
  const input = page.getByRole("spinbutton", { name: /Latest potassium result/i });

  await input.fill("5.49");
  await expect(
    page.getByRole("note", { name: /No exact source severity band matched/ }),
  ).toBeVisible();

  await input.fill("5.50");
  await expect(page.getByRole("heading", { name: "Mild hyperkalaemia" })).toBeVisible();
  await expect(page.getByText("Exclude pseudohyperkalaemia.")).toBeVisible();
  await expect(page.getByText("Perform a 12-lead ECG and monitor cardiac rhythm.")).toHaveCount(0);

  await input.fill("6.00");
  await expect(page.getByRole("heading", { name: "Moderate hyperkalaemia" })).toBeVisible();
  await expect(page.getByText("Perform a 12-lead ECG and monitor cardiac rhythm.")).toBeVisible();

  await input.fill("6.50");
  await expect(page.getByRole("heading", { name: "Severe hyperkalaemia" })).toBeVisible();

  await input.fill("7.00");
  await expect(page.getByRole("alert", { name: /Urgent source safeguard/ })).toBeVisible();
  await expect(page.getByText(/do not delay administering calcium gluconate/i)).toBeVisible();
  await expect(page.getByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).toHaveCount(0);

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps the Hyperkalaemia severity review within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyperkalaemia/severity");

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await expect(page.getByText("Reporting precision requires review")).toBeVisible();
  await expect(page.getByText("Source review approaching")).toBeVisible();
});
