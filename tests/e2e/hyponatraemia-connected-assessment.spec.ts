import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function reachEmergencyStage(page: import("@playwright/test").Page) {
  await page.getByRole("spinbutton", { name: /Latest sodium result/ }).fill("124");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Euvolaemic", { exact: true }).click();
  await page.getByText("Confusion", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

test("carries a complete connected assessment into its dynamic operational result", async ({
  page,
}) => {
  await page.goto("/review/hyponatraemia/assessment");
  await reachEmergencyStage(page);

  await expect(page.getByRole("heading", { name: "Complete emergency follow-up" })).toBeVisible();
  await page.getByText("High risk confirmed", { exact: true }).click();
  await page.getByText("Symptoms improved", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByText("Yes - results available", { exact: true }).click();
  await page.getByRole("spinbutton", { name: /Serum osmolality/ }).fill("270");
  await page.getByRole("spinbutton", { name: /^Urine osmolality/ }).fill("120");
  await page.getByRole("spinbutton", { name: /^Urine sodium/ }).fill("40.1");
  await expect(page.getByRole("heading", { name: "SIADH-compatible pattern" })).toBeVisible();
  await page.getByRole("button", { name: "Review result" }).click();

  await expect(page.getByText("Connected assessment result")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Severe hyponatraemia" })).toBeVisible();
  await expect(page.getByText("Symptomatic emergency management", { exact: true })).toBeVisible();
  await expect(page.getByText(/Page 1|Registry ID|UNVERIFIED-HYPONATRAEMIA|\.pdf/i)).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("removes the emergency stage when an upstream sign answer changes", async ({ page }) => {
  await page.goto("/review/hyponatraemia/assessment");
  await reachEmergencyStage(page);
  await page.getByText("High risk not confirmed", { exact: true }).click();
  await page.getByText("Symptoms improved", { exact: true }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByText("None of the listed signs confirmed", { exact: true }).click();

  await expect(page.getByText("Emergency follow-up", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Complete laboratory classification" }),
  ).toBeVisible();
});

test("requires an explicit euvolaemic cause before showing source-supported management", async ({
  page,
}) => {
  await page.goto("/review/hyponatraemia/assessment");
  await page.getByRole("spinbutton", { name: /Latest sodium result/ }).fill("129");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Euvolaemic", { exact: true }).click();
  await page.getByText("None of the listed signs confirmed", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("No - not available", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "Complete euvolaemic cause review" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Review result" })).toBeDisabled();
  await page.getByText("Water intoxication established", { exact: true }).click();
  await page.getByRole("button", { name: "Review result" }).click();

  await expect(
    page.getByText("Euvolaemic water-intoxication management", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Use fluid restriction and obtain consultant review.")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("preserves inputs on Back, clears on restart, and fits a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyponatraemia/assessment");
  await page.getByRole("spinbutton", { name: /Latest sodium result/ }).fill("129");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("spinbutton", { name: /Latest sodium result/ })).toHaveValue("129");

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByRole("dialog", { name: "Start assessment again?" })).toBeVisible();
  await page.getByRole("button", { name: "Clear assessment" }).click();
  await expect(page.getByRole("spinbutton", { name: /Latest sodium result/ })).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
