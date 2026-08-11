import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("adapts fluid-status questions without retaining hidden sign answers", async ({ page }) => {
  await page.goto("/review/hyponatraemia/fluid-status");

  await expect(page.getByRole("heading", { name: "Fluid-status workflow review" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Select fluid status" })).toBeVisible();

  const fluidStatusCards = page
    .getByRole("group", { name: /Establish fluid status/ })
    .locator("label > span");
  const cardHeights = await fluidStatusCards.evaluateAll((cards) =>
    cards.map((card) => card.getBoundingClientRect().height),
  );
  expect(new Set(cardHeights).size).toBe(1);

  await page.getByText("Hypovolaemic", { exact: true }).click();
  await expect(page.getByText("Signs of cerebral oedema present?", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Nausea" }).check();
  await expect(page.getByRole("alert", { name: /Source emergency branch reached/ })).toBeVisible();

  await page.getByText("Hypervolaemic", { exact: true }).click();
  await expect(page.getByText("Signs of cerebral oedema present?", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Hypervolaemic source endpoint reached" }),
  ).toBeVisible();

  await page.getByText("Euvolaemic", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Nausea" })).not.toBeChecked();
  await expect(page.getByRole("heading", { name: "Confirm listed signs" })).toBeVisible();

  const signFieldsetBox = await page
    .getByRole("group", { name: /Signs of cerebral oedema present/ })
    .boundingBox();
  const noneGroupBox = await page
    .getByText("No listed sign", { exact: true })
    .locator("xpath=ancestor::section[1]")
    .boundingBox();
  const signResultBox = await page
    .getByRole("heading", { name: "Confirm listed signs" })
    .locator("xpath=ancestor::section[1]")
    .boundingBox();

  expect(noneGroupBox?.width).toBe(signFieldsetBox?.width);
  expect((signResultBox?.y ?? 0) - ((noneGroupBox?.y ?? 0) + (noneGroupBox?.height ?? 0))).toBe(8);

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps none-confirmed exclusive and uncertainty fail-closed", async ({ page }) => {
  await page.goto("/review/hyponatraemia/fluid-status");

  await page.getByText("Hypovolaemic", { exact: true }).click();
  const nausea = page.getByRole("checkbox", { name: "Nausea" });
  const none = page.getByRole("checkbox", { name: "None of the listed signs confirmed" });
  await nausea.check();
  await none.check();
  await expect(nausea).not.toBeChecked();
  await expect(none).toBeChecked();
  await expect(
    page.getByRole("heading", { name: "Hypovolaemic branch confirmed without a listed sign" }),
  ).toBeVisible();

  await page.getByText("Unable to establish safely", { exact: true }).click();
  await expect(
    page.getByRole("note", { name: /Fluid status requires clinical review/ }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("keeps the adaptive review within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hyponatraemia/fluid-status");
  await page.getByText("Euvolaemic", { exact: true }).click();

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await expect(page.getByText("Signs of cerebral oedema present?", { exact: true })).toBeVisible();
});
