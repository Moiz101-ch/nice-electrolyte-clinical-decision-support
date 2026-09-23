import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_DKA_PREVIEW !== "1", "Detailed DKA review is development-only.");

test("carries a fixed DKA case through later stages while blocking clinical conversion", async ({
  page,
}) => {
  await page.goto("/review/dka/steps-one-to-four");
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("pressure-recovered");
  await page.getByRole("link", { name: /Review Steps 5-10/i }).click();

  await expect(page).toHaveURL(/steps-five-to-ten\?initial=pressure-recovered$/);
  await expect(page.getByText("Initial context: Pressure recovers")).toBeVisible();
  await page.getByRole("button", { name: /Step 7/i }).click();
  await expect(page.getByRole("heading", { name: "Urine-output calculation audit" })).toBeVisible();
  await expect(page.getByText("80 mL/hour")).toHaveCount(2);
  await expect(page.getByText("15 units/hour")).toBeVisible();

  await page.getByRole("button", { name: /Step 8/i }).click();
  await expect(page.getByText("Met in synthetic case")).toBeVisible();
  await page.getByRole("button", { name: /Step 9/i }).click();
  await expect(
    page.getByRole("alert", { name: /Resolution rule is not executable/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Step 10/i }).click();
  await expect(page.getByRole("heading", { name: "Isolated conversion mapping" })).toBeVisible();

  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("low-potassium");
  await page.getByRole("button", { name: /Step 7/i }).click();
  await expect(
    page.getByText("Potassium <3.5 mmol/L: immediate senior or critical-care advice is required."),
  ).toBeVisible();
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByText("YTH-DKA-V9-2019")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page
    .getByRole("link", { name: /Steps 1-4/i })
    .first()
    .click();
  await expect(page.getByRole("combobox", { name: "Test scenario" })).toHaveValue(
    "pressure-recovered",
  );
});

test("keeps later DKA stages usable at a mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/review/dka/steps-five-to-ten?initial=not-dka");

  await expect(page.getByText("Initial context: Confirmed criteria")).toBeVisible();
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("inadequate-response");
  await page.getByRole("button", { name: /Step 8/i }).click();
  await expect(page.getByText(/Response below source targets/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});
