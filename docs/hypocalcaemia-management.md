# Hypocalcaemia Management

The connected Hypocalcaemia workflow at `/review/hypocalcaemia/assessment` combines a completed
assessment, the Subtask 18 cause and safeguard gate, and deterministic mild-asymptomatic or
severe-symptomatic management. The management definition is version `0.3.0` and remains
`awaiting-clinical-review`.

The runtime instructions are transcribed from the supplied York and Scarborough Teaching Hospitals
NHS Foundation Trust `Diagnosis and Management of Hypocalcaemia`, version 4. Internal source
references remain in pathway definitions and are not displayed in the clinician-facing workflow.

## Branch Eligibility

| Completed assessment state                                                             | Management result                                                                       |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Adjusted calcium `>1.9` and `<=2.1 mmol/L`, no listed symptoms, renal failure excluded | Mild asymptomatic branch                                                                |
| Adjusted calcium `<1.9 mmol/L` with at least one source-listed symptom                 | Severe symptomatic emergency branch                                                     |
| Exactly `1.9 mmol/L`                                                                   | Unsupported treatment boundary because the severity table and management heading differ |
| Mild with symptoms                                                                     | Unsupported; no mild symptomatic branch is inferred                                     |
| Moderate/severe without symptoms                                                       | Unsupported; no asymptomatic treatment branch is inferred                               |
| Renal failure present or uncertain in the mild branch                                  | Unsupported because the mild guidance excludes renal failure                            |
| Incomplete or uncertain symptom assessment                                             | Unsupported                                                                             |

No treatment action is released until the cause and safeguard review reaches its explicit cleared
endpoint.

## Mild Branch

1. Select first-line Calcichew Forte or the Sandocal alternative for confirmed swallowing difficulty
   or intolerance.
2. Use the detailed surgery context from the safeguard review to apply the source's 24-hour
   repeat-calcium instruction after total thyroidectomy.
3. Enter the next adjusted calcium without rounding.
4. A result below `1.9 mmol/L` stops the mild pathway and requires severity reassessment.
5. A result from `1.9` through `2.1 mmol/L` generates the source-defined Calcichew increase.
6. A result above `2.1 mmol/L` exposes the source's discharge statement and calcium recheck within
   one week, while noting that broader discharge criteria are outside this pathway.
7. Confirmed post-operative persistence beyond 72 hours exposes the source-defined 1-alfacalcidol
   action and close calcium monitoring.

## Severe Symptomatic Branch

1. Display the severe symptomatic medical-emergency state.
2. Show the source-defined initial intravenous calcium gluconate instruction with ECG monitoring.
3. Display intravenous-calcium hazards and serum-calcium monitoring after each dose.
4. Ask for the clinically assessed symptom response.
5. Generate the repeat dose only when symptoms are explicitly not resolved.
6. Ask whether continuous infusion is clinically required because the source supplies no automatic
   selection criteria.
7. When required and renal safeguards permit it, show the source-defined infusion preparation and
   rate plus titration to normocalcaemia.
8. Do not generate the large-volume infusion for end-stage renal failure, dialysis, or unresolved
   renal context.

## Safety and Scope

- Every treatment remains visibly marked as an unapproved technical preview.
- Upstream assessment or safeguard changes clear dependent management answers.
- Unsupported, contradictory and uncertain combinations never produce an unsafe treatment
  instruction.
- Cause-specific actions are displayed only for explicitly confirmed causes.
- No magnesium dose is imported from the separate supplied Hypomagnesaemia document.
- No source identifier or PDF page number is shown in the workflow UI.
