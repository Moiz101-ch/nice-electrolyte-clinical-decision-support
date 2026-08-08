# Results Interface

Subtask 12 replaces the compact engine preview with a complete result view on
`/assessment/new`. The result remains in browser memory and is shown only after the structured
assessment has been reviewed and confirmed.

## Display order

The interface presents information in this fixed order:

1. Priority banner.
2. Information used by the rule engine.
3. Locked NICE-derived result.
4. Deterministic match or stop explanation.
5. Missing-information status.
6. Limitations and safety boundaries.
7. Exact NICE source and recommendation section.

This order keeps the clinical priority visible first while preserving the complete path from
confirmed data to source.

## Result states

### Supported match

A supported result displays the triggered rule ID, catalogue version, output priority, output
status, management output, clinical-review status, deterministic facts, evaluator trace, limitation,
and official NICE source. The management wording comes directly from the validated catalogue.

### Unsupported scenario

`NICE-UNSUPPORTED-001` has a separate warning presentation. It states that no definitive NICE-only
management output is available, generates no treatment instructions, attaches no treatment source,
and directs the user to an approved local protocol or specialist review.

### Blocked evaluation

Invalid, missing, out-of-scope, or configuration-error outcomes show why evaluation stopped. The
missing-information section lists the exact engine issues. No management output, fallback rule, or
NICE source is inferred.

## Locked data and editing

The result is tied to the confirmed in-memory assessment state. Selecting **Edit assessment** clears
the result, returns to the review step, and clears confirmation. The user must review and confirm the
assessment again before generating another result. Selecting **New assessment** clears all current
assessment state.

## Clinical-safety boundaries

- NICE guidance remains the only source of patient-specific management output.
- Additional journal evidence is not part of this interface and cannot alter the result.
- Every supported source opens the official NICE URL in a separate browser tab.
- Catalogue limitations and pending clinical-review status remain visible.
- The interface does not generate medication doses or electrolyte correction rates.
- The prototype must not be used as the sole basis for emergency treatment.

## Review examples

Supported example: potassium `5.5 mmol/L`, persistent hyperkalaemia, CKD stage 3b, not on dialysis,
and RAAS therapy not optimised because of hyperkalaemia. Expected rule:
`NICE-K-SZC-ELIG-001`.

Unsupported example: hypomagnesaemia in a general adult presentation. Expected rule:
`NICE-UNSUPPORTED-001`, with no treatment source or treatment instructions.
