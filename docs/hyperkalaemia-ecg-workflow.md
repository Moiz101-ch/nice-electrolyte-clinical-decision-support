# Hyperkalaemia ECG Workflow

## Status

- Application pathway: `hyperkalaemia-ecg-assessment`
- Version: `0.2.1`
- Status: Awaiting clinical review
- Scope: connected potassium severity, initial checks and ECG branch selection
- Review route: `/review/hyperkalaemia/assessment`
- Approved for patient care: No

This document records the `0.2.1` ECG subtask. The review route now renders the connected `0.3.0`
timed-management workflow documented in [Hyperkalaemia Timed Management](hyperkalaemia-timed-management.md).

## Clinical Source

- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Document: Management of Acute Hyperkalaemia in Adults
- Document version: 1.0
- First issue: November 2023
- Review: November 2026
- Internal source ID: `YSTHFT-ACUTE-HYPERKALAEMIA-V1`
- Implemented location: page 2, `Are ECG changes present?` and its immediate escalation branch

## Connected Branch

The `0.2.1` definition inherits the reviewed `0.1.0` potassium severity and initial checks. It does
not redefine those thresholds.

1. Enter a confirmed potassium result.
2. Mild Hyperkalaemia stops without requesting the ECG selector.
3. Moderate or severe Hyperkalaemia requests explicit ECG findings.
4. Potassium at or above `7.0 mmol/L` retains the existing urgent safeguard while ECG findings are
   assessed.
5. Changing potassium clears the downstream ECG selection in the UI.

## Source-Listed ECG Changes

- Peaked T waves
- Broad QRS
- Flat or absent P waves
- Bradycardia
- Ventricular tachycardia (VT)
- Sine wave

One or more listed changes may be selected. The application also provides two explicit safety
states: `None of the listed ECG changes confirmed` and `Unable to determine safely`. These are
mutually exclusive with the clinical labels in the UI. Contradictory programmatic input is blocked
by the engine as an ambiguous branch.

## Branch Outcomes

| ECG state                  | Deterministic outcome                                                |
| -------------------------- | -------------------------------------------------------------------- |
| One or more listed changes | Show cardiac monitoring/resuscitation and consider outreach referral |
| No listed changes          | Record the no-change branch without timed treatment output           |
| Unable to determine        | Stop without selecting a present-or-absent treatment branch          |
| Missing answer             | Remain awaiting input                                                |

The `0.2.1` confirmed-change outcome does not display calcium or later treatment details. These are
implemented behind the clinical-review gate in the successor `0.3.0` graph.

## Visual Asset Decision

The supplied protocol lists ECG changes as text and does not supply separately approved waveform
assets for application reuse. The UI now places six original schematic placeholders beside those
labels at the project owner's request. They are visibly marked as unapproved, are hidden from the
checkbox accessible name and do not affect pathway evaluation. No third-party trace was copied.

The drawings are simplified visual references rather than diagnostic ECG examples. Clinical review
must approve, replace or remove each drawing before project use.

## Technical Controls

- The ECG definition inherits and validates the existing severity nodes.
- Source references remain attached internally to questions, escalation and stop states.
- Source IDs, document names and page numbers are absent from the clinician-facing UI.
- Mild branches ignore stale ECG input.
- Empty, unknown or contradictory ECG selections are blocked.
- Assessment values remain in React memory and are reset on upstream change or page exit.

## Implemented In The Successor Graph

- Calcium-gluconate instructions and repeat-dose decisions
- Digoxin-toxicity timing consideration
- Insulin/glucose, capillary-glucose safeguards and salbutamol
- Sodium-zirconium conflict handling and adjunctive treatment branches
- Timed monitoring, renal/outreach escalation beyond the immediate ECG yes branch
- Cause and recurrence prevention

## Review Evidence

- [Confirmed ECG changes, desktop](screenshots/subtask-13-hyperkalaemia/ecg-confirmed-desktop.png)
- [Critical threshold with uncertain ECG assessment, mobile](screenshots/subtask-13-hyperkalaemia/ecg-uncertain-critical-mobile.png)

## Clinical Review Questions

1. Are all six ECG labels and their unapproved schematic placeholders clinically suitable?
2. Should an inability to determine ECG changes trigger a more specific local escalation?
3. Does `Cardiac monitoring/resus` require locally approved expanded wording?
4. Is `Consider referral to outreach` sufficiently explicit for project use?
5. Should mild Hyperkalaemia ever expose an ECG question based on clinical context despite the
   source's numeric ECG threshold?
