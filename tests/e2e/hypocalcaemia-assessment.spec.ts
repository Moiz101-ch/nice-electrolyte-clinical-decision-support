import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ timeout: 60_000 });

test("connects severe symptomatic Hypocalcaemia to diagnostic review", async ({ page }) => {
  await page.goto("/review/hypocalcaemia/assessment");

  await expect(
    page.getByRole("heading", {
      exact: true,
      name: "Hypocalcaemia assessment and management",
    }),
  ).toBeVisible();
  await page
    .getByRole("spinbutton", { name: /Latest adjusted serum calcium result/i })
    .fill("1.85");
  await page.getByText("Adjustment confirmed", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moderate/severe hypocalcaemia" })).toBeVisible();

  await page.getByRole("checkbox", { name: "Seizures" }).check();
  await expect(page.getByText("Source-defined medical emergency")).toBeVisible();
  await page.getByText("Rapid fall confirmed", { exact: true }).click();
  await expect(page.getByText("Labelled placeholder")).toBeVisible();
  await page.getByText("No changes confirmed", { exact: true }).click();

  await page.getByLabel(/Serum magnesium/).selectOption("below-range");
  await page.getByLabel(/Renal function/).selectOption("no-renal-failure");
  await page.getByLabel(/Recent thyroid\/parathyroid surgery/).selectOption("no-recent-surgery");
  await page.getByLabel(/Phosphate/).selectOption("low");
  await page.getByLabel(/Alkaline phosphatase/).selectOption("high");
  await page.getByLabel(/Parathyroid hormone/).selectOption("low");
  await page.getByLabel(/Vitamin D/).selectOption("deficient");

  await expect(page.getByRole("heading", { name: "Assessment inputs complete" })).toBeVisible();
  await expect(page.getByText(/Low phosphate with high alkaline phosphatase/i)).toBeVisible();
  await expect(page.getByText("Assessment complete")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Severe symptomatic emergency management" }),
  ).toBeVisible();
  await expect(page.getByText(/Initially give 10 mL of 10% calcium gluconate/i)).toHaveCount(0);

  await completeCommonGuardrails(page);
  await page
    .getByRole("group", { name: /Is hypoparathyroidism clinically confirmed/i })
    .getByText("Not confirmed", { exact: true })
    .click();
  await page
    .getByRole("group", { name: /Is vitamin D deficiency the clinically established cause/i })
    .getByText("Not confirmed", { exact: true })
    .click();
  await page
    .getByRole("group", { name: /Is hypomagnesaemia clinically established as the cause/i })
    .getByText("Confirmed", { exact: true })
    .click();
  await page.getByLabel(/Cardiac monitoring context/).selectOption("neither");

  await expect(page.getByRole("link", { name: "Review supporting-source limits" })).toBeVisible();
  await expect(page.getByText(/cannot generate a magnesium treatment instruction/i)).toBeVisible();
  await expect(page.getByText(/Initially give 10 mL of 10% calcium gluconate/i)).toBeVisible();
  await page.getByText("Symptoms not resolved", { exact: true }).click();
  await expect(page.getByText(/repeat 10 mL of 10% calcium gluconate/i)).toBeVisible();
  await page.getByText("Infusion required", { exact: true }).click();
  await expect(page.getByText(/Add 100 mL of 10% calcium gluconate to 1 L/i)).toBeVisible();
  await expect(
    page.getByText(/Titrate the infusion rate to achieve normocalcaemia/i),
  ).toBeVisible();
  await expect(page.getByText("YSTHFT-HYPOCALCAEMIA-V4")).toHaveCount(0);
  await expect(page.getByText(/page 1/i)).toHaveCount(0);

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("presents Hypomagnesaemia as supporting evidence without a standalone workflow", async ({
  page,
}) => {
  await page.goto("/review/hypomagnesaemia/supporting-guidance");

  await expect(
    page.getByRole("heading", { exact: true, name: "Hypomagnesaemia supporting guidance" }),
  ).toBeVisible();
  await expect(
    page.getByRole("note", { name: /Supporting source only - no treatment pathway/i }),
  ).toBeVisible();
  await expect(page.getByText(/conflicting oral-dose wording/i)).toBeVisible();
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText(/10 mmol|24 mmol/i)).toHaveCount(0);
  await expect(page.getByText("TGICFT-HYPOMAGNESAEMIA-UNDATED")).toHaveCount(0);
  await expect(page.getByText(/page 1/i)).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("connects a mild assessment to oral treatment and follow-up branching", async ({ page }) => {
  await page.goto("/review/hypocalcaemia/assessment");

  await page.getByRole("spinbutton", { name: /Latest adjusted serum calcium result/i }).fill("2.0");
  await page.getByText("Adjustment confirmed", { exact: true }).click();
  await page.getByRole("checkbox", { name: "None of the listed findings confirmed" }).check();
  await page.getByText("Not confirmed", { exact: true }).click();
  await page.getByText("No changes confirmed", { exact: true }).click();
  await page.getByLabel(/Serum magnesium/).selectOption("not-below-range");
  await page.getByLabel(/Renal function/).selectOption("no-renal-failure");
  await page.getByLabel(/Recent thyroid\/parathyroid surgery/).selectOption("no-recent-surgery");
  await page.getByLabel(/Phosphate/).selectOption("within-range");
  await page.getByLabel(/Alkaline phosphatase/).selectOption("not-high");
  await page.getByLabel(/Parathyroid hormone/).selectOption("not-low");
  await page.getByLabel(/Vitamin D/).selectOption("not-deficient");

  await expect(page.getByRole("heading", { name: "Mild asymptomatic management" })).toBeVisible();
  await expect(page.getByText("Calcichew Forte", { exact: true })).toHaveCount(0);
  await completeCommonGuardrails(page);
  await page
    .getByRole("group", { name: /Is hypoparathyroidism clinically confirmed/i })
    .getByText("Not confirmed", { exact: true })
    .click();
  await page.getByText("Calcichew Forte", { exact: true }).click();
  await expect(page.getByText(/Commence Calcichew Forte without vitamin D/i)).toBeVisible();
  await page.getByRole("spinbutton", { name: /Follow-up adjusted serum calcium/i }).fill("2.1");
  await expect(page.getByText(/increase Calcichew Forte to 3 tablets twice daily/i)).toBeVisible();
  await expect(page.getByText("Mild management review")).toBeVisible();

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("fails closed across the source boundary gap on mobile", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/review/hypocalcaemia/assessment");

  await page
    .getByRole("spinbutton", { name: /Latest adjusted serum calcium result/i })
    .fill("2.15");
  await page.getByText("Adjustment confirmed", { exact: true }).click();

  await expect(page.getByText("Unclassified source boundary")).toBeVisible();
  await expect(page.getByText("Source-listed symptoms and signs")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});

test("locks correction when rhabdomyolysis expert advice is not obtained", async ({ page }) => {
  await page.goto("/review/hypocalcaemia/assessment");

  await page
    .getByRole("spinbutton", { name: /Latest adjusted serum calcium result/i })
    .fill("1.85");
  await page.getByText("Adjustment confirmed", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Seizures" }).check();
  await page.getByText("Rapid fall confirmed", { exact: true }).click();
  await page.getByText("No changes confirmed", { exact: true }).click();
  await page.getByLabel(/Serum magnesium/).selectOption("not-below-range");
  await page.getByLabel(/Renal function/).selectOption("no-renal-failure");
  await page.getByLabel(/Recent thyroid\/parathyroid surgery/).selectOption("no-recent-surgery");
  await page.getByLabel(/Phosphate/).selectOption("within-range");
  await page.getByLabel(/Alkaline phosphatase/).selectOption("not-high");
  await page.getByLabel(/Parathyroid hormone/).selectOption("not-low");
  await page.getByLabel(/Vitamin D/).selectOption("not-deficient");

  await page
    .getByRole("group", {
      name: /Is this hypocalcaemia associated with a recent blood transfusion/i,
    })
    .getByText("Not confirmed", { exact: true })
    .click();
  await page
    .getByRole("group", { name: /Is rhabdomyolysis clinically confirmed/i })
    .getByText("Confirmed", { exact: true })
    .click();
  await page.getByText("Not obtained", { exact: true }).click();

  await expect(page.getByRole("heading", { name: "Correction locked" })).toBeVisible();
  await expect(page.getByText(/Initially give 10 mL of 10% calcium gluconate/i)).toHaveCount(0);
});

test("keeps all progress cards equal and readable at responsive widths", async ({ page }) => {
  await page.goto("/review/hypocalcaemia/assessment");

  for (const width of [390, 768, 1120, 1600]) {
    await page.setViewportSize({ height: 900, width });
    const layout = await page
      .getByRole("navigation", { name: "Assessment progress" })
      .evaluate((navigation) => {
        const cards = [...navigation.querySelectorAll("li")];
        const cardRects = cards.map((card) => card.getBoundingClientRect());
        const textFits = cards.every((card) =>
          [...card.querySelectorAll(":scope > span:last-child > span:not(.sr-only)")].every(
            (span) => {
              const spanRect = span.getBoundingClientRect();
              const cardRect = card.getBoundingClientRect();

              return (
                spanRect.right <= cardRect.right + 1 && span.scrollWidth <= span.clientWidth + 1
              );
            },
          ),
        );

        return {
          cardHeights: cardRects.map(({ height }) => Math.round(height)),
          cardsFit: cards.every((card) => card.scrollWidth <= card.clientWidth + 1),
          documentFits: document.documentElement.scrollWidth <= window.innerWidth,
          textFits,
        };
      });

    expect(layout.documentFits, `document overflow at ${width}px`).toBe(true);
    expect(layout.cardsFit, `card overflow at ${width}px`).toBe(true);
    expect(layout.textFits, `text overflow at ${width}px`).toBe(true);
    expect(new Set(layout.cardHeights).size, `unequal card heights at ${width}px`).toBe(1);
  }
});

async function completeCommonGuardrails(page: Page) {
  await page
    .getByRole("group", {
      name: /Is this hypocalcaemia associated with a recent blood transfusion/i,
    })
    .getByText("Not confirmed", { exact: true })
    .click();
  await page
    .getByRole("group", { name: /Is rhabdomyolysis clinically confirmed/i })
    .getByText("Not confirmed", { exact: true })
    .click();
  await page
    .getByRole("group", { name: /Is acute pancreatitis clinically confirmed/i })
    .getByText("Not confirmed", { exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "None of the listed medicines confirmed" })
    .dispatchEvent("click");
}
