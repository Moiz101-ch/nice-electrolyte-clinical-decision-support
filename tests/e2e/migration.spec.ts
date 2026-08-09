import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("loads the responsive application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="darkreader-lock"]')).toHaveAttribute("content", "true");
  await expect(
    page.getByRole("heading", { name: "Evidence-based electrolyte support" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

  const heroVisual = page.getByTestId("hero-visual");
  await expect(heroVisual).toBeVisible();
  await expect
    .poll(() =>
      heroVisual.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
});

test("tolerates extension attributes injected before hydration", async ({ page }) => {
  const hydrationErrors: string[] = [];

  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|server-rendered|server rendered/i.test(message.text())
    ) {
      hydrationErrors.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const addExtensionAttributes = () => {
      document.documentElement?.setAttribute("data-extension-hydration-test", "");
      document.body?.setAttribute("data-new-gr-c-s-check-loaded", "test");
      document.body?.setAttribute("data-gr-ext-installed", "");
    };

    addExtensionAttributes();
    new MutationObserver(addExtensionAttributes).observe(document, {
      childList: true,
      subtree: true,
    });
  });

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeEnabled();
  expect(hydrationErrors).toEqual([]);
});

test("routes assessment actions to a fail-closed migration state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "View pathway status" }).first().click();

  await expect(page).toHaveURL(/\/assessment\/new$/);
  await expect(
    page.getByRole("heading", { name: "Clinical pathways are under review" }),
  ).toBeVisible();
  await expect(page.getByText("No active clinical assessment")).toBeVisible();
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /generate result/i })).toHaveCount(0);
});

test("keeps the locked route responsive and accessible", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/assessment/new");

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("reports application health", async ({ page }) => {
  const response = await page.goto("/api/health");

  expect(response?.ok()).toBe(true);
  expect(response?.headers()["cache-control"]).toBe("no-store");
  const body = await page.locator("body").textContent();
  expect(JSON.parse(body ?? "")).toEqual({
    service: "nice-electrolyte-clinical-decision-support",
    status: "ok",
  });
});

test("opens and closes mobile navigation", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeHidden();
});

test("has no automatically detectable home-page accessibility violations", async ({ page }) => {
  await page.goto("/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
