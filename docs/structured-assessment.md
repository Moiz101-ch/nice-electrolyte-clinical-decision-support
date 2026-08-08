# Structured Assessment Workflow

The new-assessment route uses a five-step, browser-only workflow:

1. Select an electrolyte and abnormality or potassium monitoring result.
2. Enter adult age, the latest mmol/L result and pregnancy status.
3. Select one exact clinical context available for that assessment.
4. Complete only the fields required by that context.
5. Review, edit and confirm the structured information before evaluation.

Zod schemas validate each step and the final object. The final builder converts controlled answers
to the rule engine's `ValidatedAssessment` shape and validates it again with the engine schema.
Changing a confirmed field clears any existing result and requires renewed confirmation.

## Abnormality and Value Consistency

The details step and the rule-engine input schema both stop an assessment when the selected
abnormality contradicts the entered value. These guards use the project's configured adult
reference intervals:

| Electrolyte      | Low label         | High label           |
| ---------------- | ----------------- | -------------------- |
| Sodium           | Below 135 mmol/L  | Above 145 mmol/L     |
| Potassium        | Below 3.5 mmol/L  | Above 5.0 mmol/L     |
| Adjusted calcium | Below 2.20 mmol/L | 2.60 mmol/L or above |
| Magnesium        | Below 0.70 mmol/L | Above 1.0 mmol/L     |

These are input-consistency checks, not condition-management thresholds. The adjusted-calcium high
boundary aligns with NICE NG132's PHPT-specific definition of hypercalcaemia; the other reference
intervals retain the supplied project's adult lab classification. Potassium monitoring results are
not direction-constrained because monitoring can evaluate a result without asserting an
abnormality. Every condition-specific NICE rule still applies its own exact threshold and context.

## Confirmation Semantics

`Yes` and `No` become explicit booleans. `Not confirmed` remains absent from the engine context; it
is never converted to `false`. Required missing evidence therefore returns a blocked result instead
of selecting a rule from an assumption.

Pregnancy is structurally valid input but outside the adult-general MVP. The rule engine stops it
before context evaluators run and returns an `out-of-scope` blocked result.

## Result Scope

The confirmation step runs the deterministic engine and displays the complete result interface:

- matched rule ID, priority, catalogue output, explanation, limitations and exact NICE source,
- unsupported safety result without a treatment source, or
- blocked reason and exact missing or out-of-scope fields.

Assessment data stays in memory in the current browser tab and is not stored.
