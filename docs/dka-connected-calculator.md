# Connected DKA Technical Calculator

The local route `/review/dka/connected-calculator` joins the existing York Teaching Hospital
technical evaluators into a single ten-stage test workflow. It is linked from the DKA calculator
foundation page. Production builds retain the locked source gate.

The editor exposes every declared input field from the Steps 1-10 schema. It starts with a fixed
synthetic example, offers the existing early and later boundary cases, and permits changing values
for technical testing. Selecting another case or resetting discards edits. Edits remain in React
memory; refreshing or leaving the page clears them. No patient identifiers, uploads, server
submissions, saved assessments or prescriptions are supported. The interface cannot verify that
values entered by a user are synthetic, so **do not enter patient information**.

The connected evaluator validates the complete input object with the existing strict Zod schema,
then runs the existing source-mapped Steps 1-4 and Steps 5-10 evaluators. The UI shows the status
and findings for each stage. Step 4 exposes the fixed-rate insulin calculation audit, Step 7 the
weight-based urine-output threshold, and Step 8 the one-hour response trend. Early stopping and
urgent-review branches prevent later stages from being presented as complete.

The supplied source has a conflicting DKA-resolution rule. Step 9 therefore remains a hard stop;
Step 10 shows only isolated regimen mapping and is never an executable conversion stage. This
implementation does not switch silently to the newer JBDS guideline or infer a treatment-stop
instruction. It is a technical test tool, not a clinical calculator for patient care.

To inspect it locally, run `npm run dev`, open `/review/dka/calculator`, then select **Open connected
calculator**. Try changing the synthetic weight from 72 to 160 kg: the Step 4 technical rate is
capped at 15 units/hour and the Step 7 urine-output threshold changes to 80 mL/hour. Set initial
glucose to exactly 11 mmol/L to see the source's diagnostic branch stop before later stages.

The focused tests are `tests/clinical/dka-connected-calculator.test.ts` and
`tests/e2e/dka-connected-calculator.spec.ts`. The production gate is checked in
`tests/e2e/dka-production-gate.spec.ts`.
