# DKA Steps 1–4 Technical Preview

Subtask 23 implements the first four stages of the supplied York Teaching Hospital adult DKA
pathway as deterministic, source-mapped technical logic. The original source has a stated review
date of April 2021, so the clinical-activation gate remains closed.

## Scope

- Step 1 records the adult eligibility boundary, ABCDE/GCS/NEWS-MEWS checks, IV access and
  source-listed initial blood investigations and measurements. Failed IV access stops with the
  source's immediate escalation branch; missing checks or measurements stop for review.
- Step 2 requires glucose **>11 mmol/L**, blood ketones **>3 mmol/L**, and venous pH **<7.3** or
  bicarbonate **<15 mmol/L**. Equality does not satisfy a strict threshold. Missing acid-base
  alternatives fail closed unless the other available measure already meets the criterion.
- Step 3 separates initial systolic pressure **>90 mmHg** from the lower branch, models the
  source's initial 500 mL/recheck sequence, and stops for senior review when repeat pressure is
  **<90 mmHg**. The source does not specify what follows a repeat of exactly 90 mmHg; that case
  stops without an inferred fluid branch.
- Step 4 uses the shared deterministic calculation engine for
  `min(weight (kg) × 0.1 units/kg/hour, 15 units/hour)`. Its audit preserves the entered weight,
  formula, unrestricted value, source maximum and final value. The source does not define a
  prescribing increment; software precision is not presented as one.

## Safety Boundary

On a local development server, `/review/dka/steps-one-to-four` allows selection among fixed,
labelled synthetic cases only. It has no free-entry patient fields, server submission or
persistence. The screen visibly states that it is not for patient care and generates no
prescription. All results retain internal source references without displaying source IDs or
document page labels in the UI. Production builds render a locked gate instead of the preview,
because public-display reuse is not approved.

The newer [JBDS 02 adult DKA guideline](https://abcd.care/resource/current/jbds-02-management-diabetic-ketoacidosis-adults)
is a currentness-review comparator, **not** a silent replacement for the supplied Trust pathway.
Clinical reviewers must decide the future approved source and resolve the registered source
conflict before activation. Steps 5–10 are not implemented by this subtask.

## Verification

```bash
npm test -- tests/clinical/dka-steps-one-to-four.test.ts
npm test -- tests/design-system/dka-steps-one-to-four-review.test.tsx
npx playwright test tests/e2e/dka-steps-one-to-four.spec.ts --project=chromium
```
