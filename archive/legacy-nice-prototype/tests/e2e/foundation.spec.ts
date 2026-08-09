import { expect, test } from "@playwright/test";

import AxeBuilder from "@axe-core/playwright";

test("loads the responsive application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="darkreader-lock"]')).toHaveAttribute("content", "true");
  await expect(
    page.getByRole("heading", { name: "Evidence-based electrolyte support" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(
    page.getByText(/Do not enter real patient-identifiable information\./),
  ).toBeVisible();

  const heroVisual = page.getByTestId("hero-visual");
  await expect(heroVisual).toBeVisible();
  await expect
    .poll(() =>
      heroVisual.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
});

test("tolerates root attributes injected by browser extensions before hydration", async ({
  page,
}) => {
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
  await expect(
    page.getByRole("heading", { name: "Evidence-based electrolyte support" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeEnabled();

  expect(hydrationErrors).toEqual([]);
});

test("provides complete home-page content and enters the assessment workflow", async ({ page }) => {
  await page.goto("/");

  for (const electrolyte of ["Sodium", "Potassium", "Calcium", "Magnesium"]) {
    await expect(page.getByRole("heading", { name: electrolyte })).toBeVisible();
  }

  await page.getByRole("link", { name: "Start new assessment" }).first().click();
  await expect(page).toHaveURL(/\/assessment\/new$/);
  await expect(page.getByRole("heading", { name: "Adult electrolyte assessment" })).toBeVisible();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
});

test("blocks a contradictory abnormality and electrolyte value before context selection", async ({
  page,
}) => {
  await page.goto("/assessment/new");

  await page.getByRole("button", { name: "Sodium" }).click();
  await page.getByRole("button", { name: "Hypernatraemia" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("spinbutton", { name: /Age \(years\)/ }).fill("80");
  await page.getByRole("spinbutton", { name: /Latest sodium result/i }).fill("102");
  await page.getByLabel(/Pregnancy status/i).selectOption("not-pregnant");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText(/does not match Hypernatraemia/i)).toBeVisible();
  await expect(page.getByText(/reference interval requires above 145 mmol\/L/i)).toBeVisible();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Select the clinical context" })).toBeHidden();
});

test("completes a structured assessment and renders the deterministic result", async ({ page }) => {
  await page.goto("/assessment/new");

  await page.getByRole("button", { name: "Potassium" }).click();
  await page.getByRole("button", { name: "Hyperkalaemia" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("spinbutton", { name: /Age \(years\)/ }).fill("68");
  await page.getByRole("spinbutton", { name: /Latest potassium result/i }).fill("5.5");
  await page.getByLabel(/Pregnancy status/i).selectOption("not-applicable");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: /Persistent hyperkalaemia/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("group", { name: "Potassium result confirmed" }).getByText("Yes").click();
  await page.getByLabel(/CKD stage/i).selectOption("3b");
  await page
    .getByRole("group", { name: "Heart failure present" })
    .getByText("No", { exact: true })
    .click();
  await page
    .getByRole("group", { name: "Receiving dialysis" })
    .getByText("No", { exact: true })
    .click();
  await page
    .getByLabel(/RAAS antagonist status/i)
    .selectOption("not-optimised-because-hyperkalaemia");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Review and confirm" })).toBeVisible();
  await expect(page.getByText("5.5 mmol/L").first()).toBeVisible();
  await page
    .getByRole("checkbox", { name: /I confirm this structured information has been reviewed/i })
    .check();
  await page.getByRole("button", { name: "Generate result" }).click();

  await expect(page.getByText("NICE-K-SZC-ELIG-001", { exact: true })).toBeVisible();
  await expect(page.getByText(/sodium zirconium cyclosilicate is a NICE option/i)).toBeVisible();
  await expect(page.getByText(/TA1148/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why this rule matched" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exact NICE source" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open NICE guidance/i })).toHaveAttribute(
    "href",
    "https://www.nice.org.uk/guidance/ta1148/chapter/1-Recommendations",
  );

  await page.getByRole("button", { name: "Edit assessment" }).first().click();
  await page.getByRole("button", { name: "Edit basic details" }).click();
  await expect(page.getByRole("spinbutton", { name: /Latest potassium result/i })).toHaveValue(
    "5.5",
  );
  await expect(page.getByText("NICE-K-SZC-ELIG-001")).toBeHidden();
});

test("shows NICE acute hyperkalaemia medicine options only alongside standard emergency care", async ({
  page,
}) => {
  await page.goto("/assessment/new");

  await page.getByRole("button", { name: "Potassium" }).click();
  await page.getByRole("button", { name: "Hyperkalaemia" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("spinbutton", { name: /Age \(years\)/ }).fill("68");
  await page.getByRole("spinbutton", { name: /Latest potassium result/i }).fill("6.8");
  await page.getByLabel(/Pregnancy status/i).selectOption("not-applicable");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Acute life-threatening hyperkalaemia/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  for (const groupName of [
    "Acute life-threatening hyperkalaemia confirmed",
    "Currently in emergency care",
    "Standard emergency care underway",
  ]) {
    await page.getByRole("group", { name: groupName }).getByText("Yes", { exact: true }).click();
  }

  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("checkbox", { name: /I confirm this structured information has been reviewed/i })
    .check();
  await page.getByRole("button", { name: "Generate result" }).click();

  await expect(
    page.getByRole("heading", { name: "NICE emergency-care medicine options" }),
  ).toBeVisible();
  await expect(page.getByText("NICE-K-ACUTE-BINDER-OPTIONS-001", { exact: true })).toBeVisible();
  await expect(page.getByText(/only alongside standard care in emergency care/i)).toBeVisible();
  await expect(page.getByText("NICE TA1148", { exact: true })).toBeVisible();
  await expect(page.getByText("NICE TA623", { exact: true })).toBeVisible();
});

test("shows an unsupported result without treatment guidance on mobile", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/assessment/new");

  await page.getByRole("button", { name: "Magnesium" }).click();
  await page.getByRole("button", { name: "Hypomagnesaemia" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("spinbutton", { name: /Age \(years\)/ }).fill("62");
  await page.getByRole("spinbutton", { name: /Latest magnesium result/i }).fill("0.5");
  await page.getByLabel(/Pregnancy status/i).selectOption("not-applicable");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /General adult presentation/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("checkbox", { name: /I confirm this structured information has been reviewed/i })
    .check();
  await page.getByRole("button", { name: "Generate result" }).click();

  await expect(
    page.getByRole("heading", { name: "No definitive NICE-only management output" }),
  ).toBeVisible();
  await expect(page.getByText("NICE-UNSUPPORTED-001")).toBeVisible();
  await expect(page.getByText("No treatment source attached")).toBeVisible();
  await expect(page.getByText(/approved local protocol or seek specialist review/i)).toBeVisible();
  await expect(page.getByText(/replacement dose/i)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

test("keeps the adaptive assessment usable on mobile without detectable accessibility issues", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/assessment/new");

  await page.getByRole("button", { name: "Sodium" }).click();
  await page.getByRole("button", { name: "Hyponatraemia" }).click();

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

test("reports application health", async ({ page }) => {
  const response = await page.goto("/api/health");

  expect(response?.ok()).toBe(true);
  expect(response?.headers()["cache-control"]).toBe("no-store");
  const body = await page.locator("body").textContent();

  expect(JSON.parse(body ?? "")).toEqual({
    status: "ok",
    service: "nice-electrolyte-clinical-decision-support",
  });
});

test("opens and closes mobile navigation", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeHidden();
});

test("has no automatically detectable accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Evidence-based electrolyte support" }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
