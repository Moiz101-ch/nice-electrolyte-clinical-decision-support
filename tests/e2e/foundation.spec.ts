import { expect, test } from "@playwright/test";

test("loads the foundation scaffold", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "NICE Electrolyte CDS" })).toBeVisible();
  await expect(page.getByText("Educational prototype only")).toBeVisible();
});
