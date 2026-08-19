# Hyperkalaemia Clinical Review Package

## Review Gate

| Field                     | Value                                  |
| ------------------------- | -------------------------------------- |
| Package ID                | `hyperkalaemia-clinical-review-v0.3.0` |
| Connected pathway version | `0.3.0`                                |
| Prepared                  | 2026-08-19                             |
| Status                    | Awaiting clinical review               |
| Review route              | `/review/hyperkalaemia/assessment`     |
| Approved for patient care | No                                     |

This package describes the implemented deterministic pathway. It is technical evidence for
clinical review, not clinical validation, NHS approval, medical-device certification or permission
for patient use.

The reviewer must record one outcome:

- [ ] Approved for project use
- [ ] Changes requested
- [ ] Rejected or replacement source required

Until an authorized decision is recorded, every Hyperkalaemia result remains locked at
`awaiting-clinical-review`.

## Clinical Source

- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Title: Management of Acute Hyperkalaemia in Adults
- Authors: Tasnim Momoniat, Matt Cooke and Okkar Myint Zaw
- Version: 1.0
- Issue period: November 2023
- Review period: November 2026
- Relevant locations: page 1 prescribing chart and page 2 clinical pathway
- Registry status: identified source, internal verification only, awaiting clinical review

The source cites the UK Kidney Association's August 2023 acute Hyperkalaemia guidance, but that
supporting reference was not supplied. The supplied source also contains internal conflicts that
are listed below. Internal source IDs, file locations, hashes and page mappings remain in the
registry and pathway definitions; they are intentionally absent from the clinician-facing UI.

## Implementation Inventory

| Pathway definition             | Version | Status                   |
| ------------------------------ | ------- | ------------------------ |
| Potassium severity             | `0.1.0` | Awaiting clinical review |
| ECG assessment                 | `0.2.0` | Awaiting clinical review |
| Connected timed management     | `0.3.0` | Awaiting clinical review |
| Hyperkalaemia assessment route | `0.3.0` | Awaiting clinical review |

## Implemented Pathway Map

```text
Latest confirmed potassium result
  -> validate mmol/L, positive value and two-decimal maximum
  -> exact source severity band
       -> Mild 5.5-5.9
            -> initial checks
            -> daily potassium/CBG monitoring
            -> cause, medicines and diet review
       -> Moderate 6.0-6.4
            -> initial checks + 12-lead ECG/rhythm monitoring
            -> listed ECG change confirmed
                 -> cardiac-monitoring escalation
                 -> calcium administration context
                 -> pre-treatment CBG + insulin/glucose branch
                 -> salbutamol context
            -> no listed ECG change
                 -> no inferred acute drug selection
                 -> moderate monitoring + cause prevention
            -> ECG unable to determine
                 -> no acute drug selection; clinical-review warning
       -> Severe >=6.5
            -> initial checks + 12-lead ECG/rhythm monitoring
            -> at/above 7.0: do not wait for ECG before calcium context
            -> ECG-dependent calcium when applicable
            -> pre-treatment CBG + insulin/glucose branch
            -> salbutamol context
            -> severe monitoring, escalation and cause prevention
  -> sodium-zirconium conflict warning; no automated regimen
  -> clinical-review lock
```

Every branch also includes exclusion of pseudohyperkalaemia, calcium/bicarbonate checks and review
of chronic potassium context. Hidden stale inputs are ignored when an upstream answer selects a
branch that does not use them.

## Inputs And Progressive Disclosure

| Input                       | Unit/options                                               | When requested                   |
| --------------------------- | ---------------------------------------------------------- | -------------------------------- |
| Latest potassium            | mmol/L, two decimals maximum                               | Once, at entry                   |
| ECG changes                 | Six listed changes, none confirmed, or unable to determine | Potassium at or above 6.0 mmol/L |
| Digoxin-toxicity concern    | Confirmed, not confirmed, unable to determine              | When a calcium branch is reached |
| Pre-treatment blood glucose | mmol/L, two decimals maximum                               | Before insulin/glucose treatment |
| Salbutamol context          | Tachycardia, IHD, no listed caution, unable to determine   | After insulin/glucose treatment  |

The six source-listed ECG changes are peaked T waves, broad QRS complexes, flat or absent P waves,
bradycardia, ventricular tachycardia and sine-wave pattern. Selecting none or unable to determine
is mutually exclusive with a listed change.

## Threshold And Boundary Table

### Potassium severity

| Confirmed value            | Implemented result                                  |
| -------------------------- | --------------------------------------------------- |
| `5.5-5.9 mmol/L` inclusive | Mild                                                |
| `5.91-5.99 mmol/L`         | No printed band; fail closed without classification |
| `6.0-6.4 mmol/L` inclusive | Moderate                                            |
| `6.41-6.49 mmol/L`         | No printed band; fail closed without classification |
| `>=6.5 mmol/L`             | Severe                                              |
| `>=7.0 mmol/L`             | Add the source's do-not-wait-for-ECG safeguard      |

Values are not rounded into a band. Results below `5.5 mmol/L`, wrong units, non-positive values,
non-finite values and values with more than two decimal places are blocked or unsupported without
management output.

### Pre-treatment blood glucose

| Confirmed value | Implemented result                                                        |
| --------------- | ------------------------------------------------------------------------- |
| `<7.0 mmol/L`   | Insulin/glucose action plus source-listed follow-on glucose consideration |
| `>=7.0 mmol/L`  | Insulin/glucose action without that follow-on consideration               |

## Actions, Warnings And Monitoring

### Initial and ECG-dependent actions

- Exclude pseudohyperkalaemia; check calcium, bicarbonate and chronic potassium context.
- Obtain a 12-lead ECG and rhythm monitoring from `6.0 mmol/L`.
- Escalate confirmed listed ECG changes to cardiac monitoring and resuscitation facilities.
- At or above `7.0 mmol/L`, do not delay the calcium context while awaiting ECG.
- Confirm digoxin-toxicity concern before selecting the source-listed calcium administration
  duration. Unable-to-determine generates no calcium duration.

### Intracellular shift and adjuncts

- The implemented insulin/glucose regimen and low-baseline-glucose follow-on are transcribed from
  the source and remain unapproved.
- Salbutamol is withheld when tachycardia is confirmed, uses the source's lower-dose consideration
  for ischaemic heart disease and otherwise uses the source's standard consideration.
- Conditional bicarbonate, furosemide and dialysis considerations are retained with their stated
  conditions and escalation wording.
- No sodium-zirconium regimen is generated because pages 1 and 2 use conflicting initiation
  criteria.

### Monitoring and prevention

| Branch                            | Implemented monitoring                                   |
| --------------------------------- | -------------------------------------------------------- |
| Mild                              | Potassium daily and capillary blood glucose              |
| Moderate without active treatment | Consider potassium at 1-2, 4-6 and 24 hours; monitor CBG |
| Moderate after insulin/glucose    | Same potassium schedule plus source-listed CBG schedule  |
| Severe after insulin/glucose      | Potassium at 1, 2, 4, 6 and 24 hours plus CBG schedule   |

The post-insulin/glucose capillary blood glucose schedule is baseline, 30, 60, 90 and 120 minutes,
then hourly for four further hours. Implemented endpoints also review underlying causes, medicines
and diet to prevent further rise or recurrence.

## Internal Source Mapping

| Source location                              | Implemented area                          |
| -------------------------------------------- | ----------------------------------------- |
| Page 1: initial investigations               | Potassium and pre-treatment CBG inputs    |
| Page 1: prescribing and administration chart | Calcium and insulin/glucose transcription |
| Page 1: sodium-zirconium prescribing chart   | Conflict warning only                     |
| Page 2: severity and initial safety checks   | Numeric bands and common initial actions  |
| Page 2: ECG and rhythm branch                | ECG input, safeguard and escalation       |
| Page 2: first 15-30 minutes                  | Calcium context and repeat consideration  |
| Page 2: within 30-60 minutes                 | Insulin/glucose and salbutamol branches   |
| Page 2: adjunctive treatments and escalation | Conditional actions and escalation        |
| Page 2: potassium and CBG monitoring         | Severity-dependent monitoring timelines   |
| Page 2: cause and recurrence prevention      | Cause, medicines and diet review          |

## Ambiguity Register

| ID           | Unresolved item                                                                              | Current safe behavior                                          |
| ------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `HK-AMB-001` | Decimal gaps between the printed one-decimal severity bands                                  | Do not round; stop without management                          |
| `HK-AMB-002` | Moderate treatment depends on condition, ECG and rate of rise without deterministic criteria | Generate no acute drug instruction when ECG changes are absent |
| `HK-AMB-003` | Page 1 duplicates calcium rows while page 2 describes a possible repeat                      | Keep one initial action and a conditional repeat consideration |
| `HK-AMB-004` | Calcium access wording differs between the two pages                                         | Retain the page 2 large-bore IV wording for review             |
| `HK-AMB-005` | Calcium timing differs between page 1 and page 2                                             | Present the page 2 timing group for review                     |
| `HK-AMB-006` | Sodium-zirconium initiation wording conflicts between pages 1 and 2                          | Generate warning only; no regimen                              |
| `HK-AMB-007` | The source does not define "life-threatening" Hyperkalaemia precisely                        | Do not infer a sodium-zirconium eligibility rule               |
| `HK-AMB-008` | The cited UK Kidney Association source was not supplied                                      | Keep this Trust-only implementation unapproved                 |
| `HK-AMB-009` | Empirical arrhythmia treatment is mentioned without a regimen                                | Generate no empirical arrhythmia treatment                     |
| `HK-AMB-010` | Renal-team review "depending on severity" lacks a numeric threshold                          | Retain only explicitly conditioned escalation                  |
| `HK-AMB-011` | No approved ECG waveform assets were supplied                                                | Use text labels only                                           |
| `HK-AMB-012` | The source review is due in November 2026                                                    | Require currency confirmation during review                    |
| `HK-AMB-013` | Source reuse/licensing is unverified and restricted to internal verification                 | Do not treat package as publication permission                 |

## Review Cases

1. Mild endpoint: potassium `5.9`; verify daily potassium/CBG monitoring and no acute drug action.
2. Decimal gap: potassium `5.91`; verify the pathway fails closed without rounding.
3. Moderate awaiting ECG: potassium `6.0`; verify ECG is required before proceeding.
4. Moderate with no ECG change: potassium `6.4`, none confirmed; verify no acute drug action.
5. Moderate active branch: potassium `6.0`, broad QRS, no digoxin concern, CBG `6.99`, no listed
   salbutamol caution; verify calcium context, insulin/glucose and follow-on glucose consideration.
6. Severe without ECG change: potassium `6.5`, none confirmed, CBG `7.0`, no listed salbutamol
   caution; verify intracellular-shift treatment without an ECG-dependent calcium instruction.
7. Severe digoxin branch: potassium `6.5`, sine wave and digoxin concern confirmed; verify the
   slower calcium-administration consideration.
8. Severe uncertain ECG: potassium `6.5`, ECG unable to determine; verify urgent warning,
   intracellular-shift continuation and no ECG-dependent calcium instruction.
9. Seven-plus safeguard: potassium `7.0`, ECG unable to determine; verify urgent calcium context is
   requested without waiting for ECG.
10. Salbutamol cautions: repeat an active branch with tachycardia, ischaemic heart disease and unable
    to determine; verify each fail-safe outcome.
11. Sodium-zirconium conflict: complete a severe branch; verify a warning and no zirconium action.
12. Invalid inputs: verify wrong units, non-positive values, excess precision and contradictory ECG
    selections are blocked.

## Technical Evidence

- Clinical-engine tests cover exact severity boundaries, ECG dependencies, calcium context,
  pre-treatment glucose, salbutamol cautions, unresolved sodium-zirconium criteria, monitoring,
  escalation and fail-closed edge cases.
- Component tests cover progressive disclosure, dependent-state reset, restart behavior, result
  presentation and absence of clinician-visible internal source references.
- Playwright tests cover complete and uncertain branches, responsive layouts, keyboard behavior
  and automated accessibility checks.
- Source-registry verification confirms the original two-page PDF remains hash-identical.

## Review Route And Screenshots

- Connected review route: `/review/hyperkalaemia/assessment`

Key screenshots:

- [Connected timed-management result, desktop](../../screenshots/subtask-14-hyperkalaemia/timed-management-desktop.png)
- [Uncertain branch, mobile](../../screenshots/subtask-14-hyperkalaemia/timed-management-uncertain-mobile.png)

## Privacy, Accessibility And State

- No patient identifiers are requested.
- Answers remain only in React memory and are cleared on refresh or navigation away.
- No answers are placed in URLs, browser storage, cookies, analytics, logs or a database.
- The workflow supports keyboard navigation, semantic labels, visible focus, accessible alerts and
  automated axe checks.
- Upstream changes clear dependent state, Back preserves still-valid answers and restart requires
  confirmation after input begins.

## Reviewer Sign-Off

Use [review-checklist.csv](review-checklist.csv) to record each decision.

| Field                      | Reviewer entry |
| -------------------------- | -------------- |
| Project-owner reviewer     |                |
| Doctor/consultant reviewer |                |
| Review date                |                |
| Decision                   |                |
| Approved pathway version   |                |
| Required changes           |                |
| Resolved ambiguity IDs     |                |
| Remaining restrictions     |                |

The software status must not be changed to `approved-for-project-use` until the completed checklist
and authorized decision are committed with the corresponding pathway corrections.

**STOP HERE FOR CLINICAL REVIEW.**
