# Hypocalcaemia Assessment

Subtask 16 adds a connected, assessment-only technical review at
`/review/hypocalcaemia/assessment`. It is derived from the supplied York and Scarborough Teaching
Hospitals NHS Foundation Trust `Diagnosis and Management of Hypocalcaemia`, version 4.

The assessment remains `awaiting-clinical-review`. Eligible completed assessments now enter a
separate cause and safeguard review before the source-derived management definition can release
treatment instructions. Laboratory associations alone do not generate a confirmed cause diagnosis.

## Assessment Flow

1. Enter the latest laboratory-reported adjusted serum calcium.
2. Explicitly confirm that the value is adjusted for albumin.
3. Apply the exact printed severity band without rounding.
4. Record every confirmed source-listed symptom or an explicit none/uncertain state.
5. Record whether a rapid fall is clinically established; no numeric rate threshold is inferred.
6. Record the current ECG assessment using confirmed, not-confirmed or unable-to-assess states.
7. Record magnesium, renal function and recent thyroid/parathyroid surgery context.
8. When recent surgery is not confirmed, record phosphate, alkaline phosphatase, PTH and vitamin D
   statuses against local laboratory reference ranges.
9. Display source-linked review flags as possible associations, never confirmed diagnoses.

Changing an upstream answer clears all dependent answers. Contradictory symptom selections are
blocked by the engine and prevented by the UI.

## Source Boundaries

| Adjusted serum calcium | Result                                                 |
| ---------------------- | ------------------------------------------------------ |
| `<1.9 mmol/L`          | Moderate/severe hypocalcaemia                          |
| `1.9-2.1 mmol/L`       | Mild hypocalcaemia                                     |
| `>2.1 and <2.2 mmol/L` | Explicit unclassified source-boundary review state     |
| `>=2.2 mmol/L`         | Does not meet the supplied definition of hypocalcaemia |

The source defines hypocalcaemia as adjusted calcium below `2.2 mmol/L`, while its printed mild band
ends at `2.1 mmol/L`. The implementation does not invent a severity for the intervening values.

The source also states that symptoms depend on the rate of calcium fall. The workflow records this
as a clinician-confirmed context because no numeric rate threshold is supplied.

## Safety States

- An unadjusted or unconfirmed calcium result stops before severity classification.
- Severe symptomatic hypocalcaemia displays the source-defined medical-emergency warning before
  the connected, review-gated management stage.
- Uncertain symptom and ECG states remain explicit and are never interpreted as normal.
- Ionised calcium is identified as the source's emergency measurement, but adjusted-calcium bands
  are never applied to an ionised result.
- The supplied ECG comparison is represented by a labelled placeholder because no approved reusable
  ECG visual is registered.
- Laboratory values without source-defined numeric thresholds are classified against the reporting
  laboratory's own reference ranges.

## Connected Scope

See [Hypocalcaemia cause and safeguard review](hypocalcaemia-causes-guardrails.md) for the mandatory
review gate and [Hypocalcaemia management](hypocalcaemia-management.md) for the connected treatment
branches. The overall workflow remains unavailable for clinical use.
