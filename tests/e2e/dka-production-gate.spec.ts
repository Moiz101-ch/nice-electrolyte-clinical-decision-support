import { expect, test } from "@playwright/test";

test.skip(
  process.env.PLAYWRIGHT_DKA_PREVIEW === "1",
  "Production gate is not shown in development.",
);

test("keeps unapproved DKA source details unavailable in production", async ({ page }) => {
  const routes = [
    { path: "/review/dka/source-currentness", alert: "Detailed source review unavailable" },
    { path: "/review/dka/calculator", alert: "Calculator review unavailable" },
    { path: "/review/dka/connected-calculator", alert: "Technical calculator unavailable" },
    { path: "/review/dka/steps-one-to-four", alert: "Technical preview unavailable" },
    { path: "/review/dka/steps-five-to-ten", alert: "Technical preview unavailable" },
  ];

  for (const { path, alert } of routes) {
    await page.goto(path);
    await expect(page.getByRole("alert", { name: new RegExp(alert) })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByRole("spinbutton")).toHaveCount(0);
    await expect(page.getByText("YTH-DKA-V9-2019")).toHaveCount(0);
  }
});

test("opens the current JBDS calculator in production", async ({ page }) => {
  await page.goto("/review/dka/current-calculator");
  await expect(page.getByRole("heading", { name: "Connected DKA calculator" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Test scenario" })).toBeVisible();
  await expect(
    page.getByText("Technical calculator only - do not use for patient care"),
  ).toHaveCount(0);
});
