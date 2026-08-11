# Hyponatraemia Operational Result

## Purpose

Subtask 10 adds a consolidated technical-review result for the implemented hyponatraemia
workflows. It answers the operational questions in one screen: severity, current branch,
immediate actions, correction target, safety warnings, monitoring, next steps, escalation,
compatible causes, deterministic rationale, and clinical-review status.

The route is `/review/hyponatraemia/result`. It displays a fixed representative example and does
not accept or store patient data.

## Composition

`evaluateHyponatraemiaOperationalResult` composes the outputs of the existing deterministic
severity, fluid-status/emergency-management, and urine/osmolality-classification engines. It does
not reproduce clinical thresholds in React and does not add treatment instructions.

The representative state is:

- sodium 124 mmol/L
- euvolaemic fluid status
- confusion confirmed
- high ODS risk confirmed
- symptoms improved after initial treatment
- serum osmolality 270 mOsm/kg
- urine osmolality 120 mOsm/kg
- urine sodium 40.1 mEq/L

This produces the severe symptomatic emergency branch, enhanced sodium monitoring, cause
management with consultant review, and a SIADH-compatible classification. The compatible cause is
not a diagnosis and no SIADH treatment instructions are generated.

## Safety Behaviour

- Invalid or contradictory inputs block the composed result.
- Incomplete emergency or classification input remains `awaiting-input`.
- Undefined threshold intervals remain review stops and never infer an action.
- Emergency management remains available when urine results are unavailable.
- Actions, warnings, monitoring items, issues, and provenance references are deduplicated.
- The composed result is deeply immutable and deterministic.
- Every result remains `awaiting-clinical-review` and locked from project use.

## Traceability

Source identifiers, document locations, sections, and page mappings remain in pathway definitions,
evaluation snapshots, and tests for governance. They are intentionally not rendered in the review
interface. The UI displays only the pathway version and clinical-review status.

## Review Checklist

1. Open `/review/hyponatraemia/result`.
2. Confirm the summary shows severe hyponatraemia, the symptomatic emergency branch, euvolaemic
   status, and clinical review required.
3. Confirm immediate actions and the correction target appear before monitoring and next steps.
4. Confirm the correction-limit warning is prominent.
5. Confirm enhanced monitoring, consultant review, and the compatible cause category are clear.
6. Confirm the deterministic explanation matches the representative inputs.
7. Confirm no document name, source ID, page number, or citation panel is visible.
8. Confirm the page remains readable on a narrow mobile viewport.

This is a technical implementation review, not clinical approval.
