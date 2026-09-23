# DKA Calculator Foundation

Subtask 22 provides the technical calculator shell without implementing or activating any DKA
clinical stage. The supplied source remains overdue and the source-currentness gate remains closed.

## Review Route

`/review/dka/calculator` is a technical-review route linked from the DKA source-currentness page. It
contains:

- selectable navigation across all ten mapped source stages;
- an immutable, versioned calculator session;
- a typed input-store contract;
- the deterministic calculation-engine contract;
- the transparent-result contract; and
- stage-to-rule source mapping.

Stage selection is catalogue navigation only. It does not mark previous stages complete, begin an
assessment or generate clinical output.

The detailed foundation view is limited to local development while the registered source remains
restricted to internal verification. Production builds show the source gate instead.

## Typed Session

`DkaCalculatorSession<TInputKey>` constrains every future input to the validated
`PathwayInputDatum` union:

- finite numeric measurements with exact units;
- explicit single-choice values;
- unique multi-select values; and
- explicit boolean confirmations.

The current session has no declared clinical input keys, stores no values and returns no calculated
results. Subtask 23 must introduce source-derived input keys and validation one stage at a time.

## Calculation Transparency

The shared deterministic pathway engine now records each successful calculation in an immutable
audit entry containing:

- the declared formula label;
- resolved operand keys, kinds, values and units;
- operation, precision and rounding mode;
- unrestricted calculated value;
- source-defined minimum or maximum and whether it was applied;
- final value and unit; and
- internal source references.

Calculation limits must use the output unit. Missing operands, invalid units, non-finite results and
malformed definitions continue to fail closed. The engine uses no LLM or executable expression from
pathway data.

## Source Mapping

The route reads the immutable ten-stage map created by the DKA currentness review. Each selected
stage exposes only the names of its mapped future rules. Internal source identifiers and page labels
remain available to schema and governance tests but are not rendered in the UI.

## Current Boundary

This foundation does not implement:

- patient inputs;
- DKA diagnostic confirmation;
- blood-pressure or fluid branching;
- weight-based insulin calculation;
- treatment actions or warnings;
- monitoring calculations; or
- resolution and conversion logic.

Steps 1–4 are now mapped into a separate synthetic technical preview under
`/review/dka/steps-one-to-four`. They remain unavailable for clinical use until the currentness,
conflict, approval and reuse requirements are resolved. Steps 5–10 are outside Subtask 23.

## Verification

```bash
npm test -- tests/clinical/dka-calculator-foundation.test.ts
npm test -- tests/clinical/pathway-schema.test.ts tests/clinical/pathway-engine.test.ts
npm test -- tests/design-system/dka-calculator-foundation-review.test.tsx
npx playwright test tests/e2e/dka-calculator-foundation.spec.ts --project=chromium
```

Subtask 22 stops at the calculator foundation. No DKA stage is executable.
