# Hyperkalaemia Potassium Severity

## Status

- Application pathway: `hyperkalaemia-potassium-severity`
- Version: `0.1.0`
- Status: Awaiting clinical review
- Scope: potassium input, automatic severity classification and initial checks only
- Review route: `/review/hyperkalaemia/severity`
- Approved for patient care: No

## Clinical Source

- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Document: Management of Acute Hyperkalaemia in Adults
- Document version: 1.0
- First issue: November 2023
- Review: November 2026
- Internal source ID: `YSTHFT-ACUTE-HYPERKALAEMIA-V1`
- Implemented location: page 2, initial checks and severity row

The source is an operational Trust protocol. It is not presented as NICE guidance. Its cited UK
Kidney Association reference was not supplied as an immutable project source.

## Deterministic Input

The evaluator accepts one finite potassium result in `mmol/L`, greater than zero, with no more than
two decimal places. It does not round the result before branching.

| Severity | Exact implemented source band | Source context                                                |
| -------- | ----------------------------- | ------------------------------------------------------------- |
| Mild     | `5.5-5.9 mmol/L`              | Consider cause and need for treatment                         |
| Moderate | `6.0-6.4 mmol/L`              | Management guided by clinical condition, ECG and rate of rise |
| Severe   | `>=6.5 mmol/L`                | Emergency treatment indicated                                 |

Results below `5.5 mmol/L`, between the printed bands, or with unsupported precision stop without a
Hyperkalaemia severity classification. No rounding or unstated threshold is inferred.

## Initial Checks

All supported severity branches return these source-derived checks:

1. Exclude pseudohyperkalaemia.
2. Check serum calcium and bicarbonate.
3. Check whether potassium is chronically raised and within the patient's satisfactory range,
   including in known CKD.

At `>=6.0 mmol/L`, the evaluator additionally returns:

- Perform a 12-lead ECG and monitor cardiac rhythm.

At `>=7.0 mmol/L`, it also returns the critical source safeguard not to delay calcium gluconate
while awaiting ECG. This subtask does not supply a dose or complete treatment branch.

## Deliberately Deferred

- ECG-change selection and approved visual assets
- Arrhythmia branch selection
- Calcium, insulin/glucose, salbutamol and potassium-removal treatment instructions
- Timed management and repeat-dose decisions
- Ongoing potassium and capillary-glucose monitoring
- Renal, outreach and dialysis escalation branches
- Cause and recurrence-prevention workflow

These belong to Subtasks 13 and 14 and must not be inferred from potassium severity alone.

## Technical Controls

- The pathway is a Zod-validated declarative definition evaluated by the shared deterministic
  engine.
- Every node, action and warning retains an internal source reference.
- Source IDs, document names and page numbers are not displayed in the clinician-facing review UI.
- Results remain in React memory and are not saved, logged, placed in URLs or sent to analytics.
- Unsupported values fail closed without actions or warnings.

## Review Evidence

- [Desktop severity review](screenshots/subtask-12-hyperkalaemia/severity-desktop.png)
- [Mobile critical-safeguard review](screenshots/subtask-12-hyperkalaemia/severity-critical-mobile.png)

## Clinical Review Questions

1. Should laboratory results reported between `5.9` and `6.0`, or between `6.4` and `6.5`, be
   rounded, classified continuously or remain blocked?
2. Are two decimal places appropriate for the accepted laboratory input?
3. Does the `>=7.0 mmol/L` safeguard require additional escalation wording in the severity stage?
4. Is the protocol still current for project use as its November 2026 review date approaches?
5. Are the initial check labels suitable for clinician-facing use?
