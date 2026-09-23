import { expect, test } from "@playwright/test";

test("animates page entry and interactive choices without shifting layout", async ({ page }) => {
  await page.goto("/");
  const pageContent = page.locator(".motion-page-enter").first();
  await expect(pageContent).toBeVisible();
  expect(await pageContent.evaluate((element) => getComputedStyle(element).animationName)).toBe(
    "page-enter",
  );
  const homeSection = page.locator(".motion-page-enter > * > *").first();
  expect(await homeSection.evaluate((element) => getComputedStyle(element).animationName)).toBe(
    "section-enter",
  );
  const pathwayCard = page.locator(".motion-surface").first();
  await pathwayCard.hover();
  await expect
    .poll(() => pathwayCard.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe("none");

  await page.goto("/review/pathway-ui");
  const choice = page.getByText("Context option A", { exact: true }).locator("xpath=../..");
  await choice.click();
  await expect(page.getByRole("radio", { name: /Context option A/ })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("animates workflow and progress states across assessment pages", async ({ page }) => {
  await page.goto("/assessment/new");
  await expect(page.getByText("Magnesium has no standalone calculator.")).toHaveCount(0);
  const workflowRow = page.locator(".motion-workflow-row").first();
  await expect(workflowRow).toBeVisible();
  expect(
    await workflowRow.evaluate((element) => getComputedStyle(element).transitionProperty),
  ).toContain("background-color");

  await page.goto("/review/hyponatraemia/assessment");
  const progress = page.locator(".motion-progress-step[aria-current='step']").first();
  await expect(progress).toBeVisible();
  expect(
    await progress.evaluate((element) => getComputedStyle(element).transitionProperty),
  ).toContain("box-shadow");
  const notice = page.locator(".motion-alert").first();
  expect(await notice.evaluate((element) => getComputedStyle(element).animationName)).toBe(
    "surface-enter",
  );
});

test("opens and closes the mobile navigation smoothly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Application navigation" });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => getComputedStyle(element).animationName)).toBe(
    "drawer-enter",
  );
  await page.getByRole("button", { name: "Close navigation" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("removes decorative motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const content = page.locator(".motion-page-enter").first();
  expect(await content.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  const firstCard = page.locator(".motion-home-grid > *").first();
  expect(await firstCard.evaluate((element) => getComputedStyle(element).animationName)).toBe(
    "none",
  );
  const button = page.getByRole("link", { name: "New assessment" }).first();
  await button.hover();
  expect(await button.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  const homeSection = page.locator(".motion-page-enter > * > *").first();
  expect(await homeSection.evaluate((element) => getComputedStyle(element).animationName)).toBe(
    "none",
  );
  const pathwayCard = page.locator(".motion-surface").first();
  await pathwayCard.hover();
  expect(await pathwayCard.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});
