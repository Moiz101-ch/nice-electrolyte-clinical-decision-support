import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("connects potassium severity to mutually exclusive ECG outcomes", async ({ page }) => {
  await page.goto("/review/hyperkalaemia/assessment");

  await expect(page.getByRole("heading", { name: "Hyperkalaemia ECG assessment" })).toBeVisible();
  const input = page.getByRole("spinbutton", { name: /Latest potassium result/i });
  const peaked = page.getByRole("checkbox", { name: "Peaked T waves" });
  const none = page.getByRole("checkbox", { name: "None of the listed ECG changes confirmed" });

  await peaked.check();
  await expect(page.getByRole("heading", { name: "ECG changes confirmed" })).toBeVisible();
  await expect(page.getByText("Use cardiac monitoring and resuscitation support.")).toBeVisible();

  await none.check();
  await expect(peaked).not.toBeChecked();
  await expect(
    page.getByRole("heading", { name: "No listed ECG changes confirmed" }),
  ).toBeVisible();

  await input.fill("5.9");
  await expect(page.getByRole("heading", { name: "Mild hyperkalaemia" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Source-listed ECG changes" })).toHaveCount(0);

  await input.fill("7.0");
  await expect(page.getByRole("alert", { name: /Urgent source safeguard/ })).toBeVisible();
  await expect(page.getByText("Confirm ECG findings")).toBeVisible();
  await page.getByRole("checkbox", { name: "Unable to determine safely" }).check();
  await expect(page.getByText("ECG assessment requires review")).toBeVisible();
  await expect(page.getByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).toHaveCount(0);

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps the connected ECG workflow within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyperkalaemia/assessment");

  await page.getByRole("checkbox", { name: "Sine wave" }).check();
  await expect(page.getByRole("heading", { name: "ECG changes confirmed" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await expect(page.getByText("Text labels only")).toBeVisible();
});
