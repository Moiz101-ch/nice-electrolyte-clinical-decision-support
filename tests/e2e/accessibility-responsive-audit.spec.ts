import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const activeRoutes = [
  { heading: "Acute electrolyte management", path: "/" },
  { heading: "Choose an assessment", path: "/assessment/new" },
  { heading: "Hyponatraemia assessment", path: "/review/hyponatraemia/assessment" },
  { heading: "Hyperkalaemia timed management", path: "/review/hyperkalaemia/assessment" },
  {
    heading: "Hypocalcaemia assessment and management",
    path: "/review/hypocalcaemia/assessment",
  },
  { heading: "Connected DKA calculator", path: "/review/dka/current-calculator" },
  {
    heading: "Hypomagnesaemia supporting guidance",
    path: "/review/hypomagnesaemia/supporting-guidance",
  },
  { heading: "Shared pathway UI framework", path: "/review/pathway-ui" },
] as const;

const viewports = [
  { height: 800, name: "320px reflow", width: 320 },
  { height: 844, name: "mobile", width: 390 },
  { height: 1024, name: "tablet", width: 768 },
  { height: 900, name: "desktop", width: 1440 },
] as const;

test.describe("Subtask 27 accessibility and responsive audit", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const route of activeRoutes) {
    test(`${route.heading} passes automated checks at all supported widths`, async ({ page }) => {
      for (const viewport of viewports) {
        await page.setViewportSize({ height: viewport.height, width: viewport.width });
        await page.goto(route.path);
        await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();

        const layout = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(layout.scrollWidth, `${viewport.name} layout must not overflow`).toBeLessThanOrEqual(
          layout.clientWidth,
        );

        const undersizedControls = await page
          .locator("a:visible, button:visible, select:visible, input:visible")
          .evaluateAll((controls) =>
            controls.flatMap((control) => {
              const input = control as HTMLInputElement;
              if (control.tagName === "A" && control.closest("p")) return [];
              const measuredElement =
                input.matches('input[type="checkbox"], input[type="radio"]') && input.labels?.[0]
                  ? input.labels[0]
                  : control;
              const rect = measuredElement.getBoundingClientRect();
              return rect.width < 24 || rect.height < 24
                ? [
                    `${control.tagName.toLowerCase()}#${input.id || "unlabelled"} (${Math.round(rect.width)}x${Math.round(rect.height)})`,
                  ]
                : [];
            }),
          );
        expect(
          undersizedControls,
          `${viewport.name} controls must meet minimum target size`,
        ).toEqual([]);

        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
    });
  }

  test("supports skip navigation and workflow selection using only the keyboard", async ({
    page,
  }) => {
    await page.goto("/assessment/new");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    expect(await skipLink.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
      "none",
    );
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();

    const workflowLink = page.getByRole("link", { name: "Open Hyponatraemia workflow" });
    for (let index = 0; index < 12; index += 1) {
      if (await workflowLink.evaluate((element) => element === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(workflowLink).toBeFocused();
    expect(
      await workflowLink.evaluate((element) => getComputedStyle(element).outlineStyle),
    ).not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/review\/hyponatraemia\/assessment$/);
  });

  test("exposes keyboard-selectable decisions and announced results", async ({ page }) => {
    await page.goto("/review/pathway-ui");
    const contextOption = page.getByRole("radio", { name: /Context option A/ });
    await contextOption.focus();
    await page.keyboard.press("Space");
    await expect(contextOption).toBeChecked();

    await page.goto("/review/dka/current-calculator");
    await page.getByRole("combobox", { name: "Test scenario" }).selectOption("standard");
    const resultRegion = page.locator('[aria-live="polite"][aria-labelledby="jbds-result-title"]');
    await expect(resultRegion).toContainText("Calculated result");
    await expect(resultRegion).toContainText("All three JBDS diagnostic criteria are met.");
  });
});
