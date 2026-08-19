import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("connects severe Hyperkalaemia to timed treatment, monitoring and prevention", async ({
  page,
}) => {
  await page.goto("/review/hyperkalaemia/assessment");

  await expect(page.getByRole("heading", { name: "Hyperkalaemia timed management" })).toBeVisible();
  await page.getByRole("checkbox", { name: "None of the listed ECG changes confirmed" }).check();
  await page
    .getByRole("spinbutton", { name: /Confirmed pre-treatment blood glucose/i })
    .fill("6.9");
  await page.getByText("No listed caution confirmed", { exact: true }).click();

  await expect(page.getByRole("heading", { name: "Connected management output" })).toBeVisible();
  await expect(page.getByText(/Give 6 units of soluble insulin \(Actrapid\)/i)).toBeVisible();
  await expect(page.getByText(/Because pre-treatment blood glucose is below 7.0/i)).toBeVisible();
  await expect(page.getByText("Conflicting sodium-zirconium criteria")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ongoing monitoring" })).toBeVisible();
  await expect(page.getByText("Cause and recurrence prevention")).toBeVisible();
  await expect(page.getByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).toHaveCount(0);
  await expect(page.getByText(/page 2/i)).toHaveCount(0);

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("selects calcium and salbutamol safeguards from explicit contexts", async ({ page }) => {
  await page.goto("/review/hyperkalaemia/assessment");

  await page.getByRole("checkbox", { name: "Broad QRS" }).check();
  await expect(page.getByRole("heading", { name: "ECG changes confirmed" })).toBeVisible();
  await expect(page.getByText("Use cardiac monitoring and resuscitation support.")).toBeVisible();
  await page.getByText("Concern not confirmed", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Confirmed pre-treatment blood glucose/i }).fill("7");
  await page.getByText("Tachycardia confirmed", { exact: true }).click();

  await expect(
    page.getByText(/Administer 30 mL of intravenous calcium gluconate 10%/i),
  ).toBeVisible();
  await expect(page.getByText("Salbutamol avoided")).toBeVisible();
  await expect(page.getByText("Consider 10-20 mg nebulised salbutamol.")).toHaveCount(0);
});

test("keeps the critical uncertainty branch inside a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyperkalaemia/assessment");
  const potassium = page.getByRole("spinbutton", { name: /Latest potassium result/i });

  await potassium.fill("7.0");
  await page.getByRole("checkbox", { name: "Unable to determine safely" }).check();
  await page
    .getByRole("region", { name: "Calcium administration context" })
    .getByText("Unable to determine", { exact: true })
    .click();
  await page.getByRole("spinbutton", { name: /Confirmed pre-treatment blood glucose/i }).fill("7");
  await page
    .getByRole("region", { name: "Salbutamol context" })
    .getByText("Unable to determine", { exact: true })
    .click();

  await expect(page.getByText("Calcium duration requires urgent review")).toBeVisible();
  await expect(page.getByText("No salbutamol instruction generated")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await expect(page.getByText("Source conflict held")).toBeVisible();
});
