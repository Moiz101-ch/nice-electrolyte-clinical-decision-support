import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_DKA_PREVIEW !== "1", "Detailed DKA review is development-only.");

test("recalculates a connected synthetic case and retains the resolution hard stop", async ({
  page,
}) => {
  await page.goto("/review/dka/calculator");
  await page.getByRole("link", { name: "Open historical York calculator" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "DKA connected calculator" }),
  ).toBeVisible();

  const stages = page.getByRole("navigation", { name: "DKA calculator stages" });
  await stages.getByRole("button", { name: /Step 4/ }).click();
  await expect(page.getByText("7.2 units/hour", { exact: true }).first()).toBeVisible();

  await stages.getByRole("button", { name: /^Step 1\b/ }).click();
  await page.getByRole("spinbutton", { name: "Weight (kg)" }).fill("160");
  await stages.getByRole("button", { name: /Step 4/ }).click();
  await expect(page.getByText("16 units/hour", { exact: true })).toBeVisible();
  await expect(page.getByText("15 units/hour", { exact: true }).first()).toBeVisible();
  await stages.getByRole("button", { name: /Step 7/ }).click();
  await expect(page.getByRole("note", { name: /Recorded rate differs/ })).toBeVisible();
  await expect(page.getByText("80 mL/hour", { exact: true })).toBeVisible();

  await stages.getByRole("button", { name: /^Step 1\b/ }).click();
  await page.getByRole("spinbutton", { name: "Initial blood glucose (mmol/L)" }).fill("11");
  await stages.getByRole("button", { name: /Step 4/ }).click();
  await expect(page.getByText("This stage has not been reached.")).toBeVisible();
  await expect(page.getByText("Technical value")).toHaveCount(0);

  await page.getByRole("button", { name: "Reset case" }).click();
  await stages.getByRole("button", { name: /Step 9/ }).click();
  await expect(page.getByText("Resolution rule blocked by source conflict")).toBeVisible();
  await stages.getByRole("button", { name: /Step 10/ }).click();
  await expect(page.getByText("Conversion cannot be entered from Step 9")).toBeVisible();

  await stages.getByRole("button", { name: /Step 2/ }).click();
  await page.getByRole("spinbutton", { name: "Venous pH" }).fill("15");
  await expect(page.getByRole("spinbutton", { name: "Venous pH" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByRole("button", { name: "Reset case" }).click();
  await expect(page.getByRole("spinbutton", { name: "Age (years)" })).toHaveValue("35");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("handles an urgent later branch and stays within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/review/dka/connected-calculator");
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("later-low-potassium");
  await page.getByRole("combobox", { name: "Calculator stage" }).selectOption("7");
  await expect(page.getByText("Urgent monitoring branch requires review")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
