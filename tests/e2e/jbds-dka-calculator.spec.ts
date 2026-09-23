import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("runs the connected synthetic case and recalculates after edits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open DKA calculator" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Connected DKA calculator" }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Test scenario" })).toHaveValue("blank");
  await expect(page.getByRole("spinbutton", { name: "Age (years)" })).toBeEmpty();
  await expect(page.getByText("All three JBDS diagnostic criteria are met.")).toHaveCount(0);
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("standard");

  const stages = page.getByRole("navigation", { name: "DKA calculator stages" });
  await stages.getByRole("button", { name: /Stage 4.*Insulin and glucose/ }).click();
  await expect(page.getByText("7 units/hour", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/10% glucose at 125 mL\/hour/)).toBeVisible();
  await stages.getByRole("button", { name: /Stage 6.*Resolution and transition/ }).click();
  await expect(
    page.getByText("Resolution and minimum IV-to-subcutaneous overlap are confirmed."),
  ).toBeVisible();

  await stages.getByRole("button", { name: /Stage 1.*Diagnosis/ }).click();
  await page.getByRole("spinbutton", { name: "Presenting glucose (mmol/L)" }).fill("11");
  await page.getByRole("combobox", { name: "Known diabetes?" }).selectOption("no");
  await expect(page.getByText("DKA criteria or adult-team scope are not met.")).toBeVisible();
  await stages.getByRole("button", { name: /Stage 6.*Resolution and transition/ }).click();
  await expect(page.getByText("No DKA management branch.")).toBeVisible();
  await page.getByRole("button", { name: "Clear inputs" }).click();
  await expect(page.getByRole("combobox", { name: "Test scenario" })).toHaveValue("blank");
  await expect(page.getByRole("spinbutton", { name: "Age (years)" })).toBeEmpty();
  await expect(
    page.getByText("Confirm the three diagnostic criteria and adult-team scope."),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("starts blank and calculates only after manual diagnostic entry", async ({ page }) => {
  await page.goto("/review/dka/current-calculator");

  await expect(page.getByRole("combobox", { name: "Test scenario" })).toHaveValue("blank");
  await expect(page.getByRole("spinbutton", { name: "Age (years)" })).toBeEmpty();
  await expect(page.getByRole("spinbutton", { name: "Presenting glucose (mmol/L)" })).toBeEmpty();
  await expect(
    page.getByText("Confirm the three diagnostic criteria and adult-team scope."),
  ).toBeVisible();

  await page.getByRole("spinbutton", { name: "Age (years)" }).fill("42");
  await page.getByRole("combobox", { name: "Known diabetes?" }).selectOption("yes");
  await page.getByRole("spinbutton", { name: "Presenting glucose (mmol/L)" }).fill("24");
  await page.getByRole("spinbutton", { name: "Presenting blood ketones (mmol/L)" }).fill("5.4");
  await expect(page.getByText("All three JBDS diagnostic criteria are met.")).toHaveCount(0);
  await page.getByRole("spinbutton", { name: "Presenting venous pH" }).fill("7.16");
  await expect(page.getByText("All three JBDS diagnostic criteria are met.")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Test scenario" })).toHaveValue("blank");

  await page.getByRole("button", { name: "Clear inputs" }).click();
  await expect(page.getByRole("spinbutton", { name: "Age (years)" })).toBeEmpty();
  await expect(page.getByText("All three JBDS diagnostic criteria are met.")).toHaveCount(0);
});

test("shows low-potassium review and remains within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/review/dka/current-calculator");
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("low-bp");
  await page.getByRole("combobox", { name: "Calculator stage" }).selectOption("3");
  await expect(page.getByText(/FRIII start requires IV access/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});

test("describes rising ketones correctly and shows the source response action", async ({
  page,
}) => {
  await page.goto("/review/dka/current-calculator");
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("standard");

  const stages = page.getByRole("navigation", { name: "DKA calculator stages" });
  await stages.getByRole("button", { name: /Stage 5.*Response monitoring/ }).click();
  await page.getByRole("spinbutton", { name: "Latest blood ketones (mmol/L)" }).fill("3");

  await expect(page.getByText(/Ketones increased by 1.8 mmol\/L\/hour/)).toBeVisible();
  await expect(page.getByText(/Ketones fell by -1.8/)).toHaveCount(0);
  await expect(page.getByText(/increase the insulin infusion rate by 1 unit\/hour/)).toBeVisible();
  await expect(page.getByText(/No automatic dose increase is generated/)).toHaveCount(0);
});
