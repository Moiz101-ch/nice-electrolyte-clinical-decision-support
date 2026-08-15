# Hyponatraemia Clinical Review Package

## Review Gate

| Field                     | Value                                  |
| ------------------------- | -------------------------------------- |
| Package ID                | `hyponatraemia-clinical-review-v0.7.0` |
| Connected pathway version | `0.7.0`                                |
| Prepared                  | 2026-08-16                             |
| Status                    | Awaiting clinical review               |
| Review route              | `/review/hyponatraemia/assessment`     |
| Approved for patient care | No                                     |

This package describes the implemented deterministic pathway. It is technical evidence for
clinical review, not clinical validation, NHS approval, medical-device certification or permission
for patient use.

The reviewer must record one outcome:

- [ ] Approved for project use
- [ ] Changes requested
- [ ] Rejected or replacement source required

Until an authorized decision is recorded, every Hyponatraemia result remains locked at `awaiting-clinical-review`.

## Clinical Sources

### Emergency management source

- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Title: Emergency Management of Hyponatraemia
- Owner: Dr T Pawlak
- Version: 1.0
- Issue period: February 2025
- Review period: February 2028
- Relevant location: page 1, complete flowchart
- Registry status: identified source, awaiting clinical review

### Classification sources

Two supplied images describe serum osmolality, extracellular-volume status, urine findings and
compatible causes. Neither image contains visible organisation, author, version, issue date, review
date or approval metadata. They remain unverified draft sources and cannot independently authorize
treatment.

Internal source IDs, file locations, hashes and page mappings remain in the source registry and
pathway definitions. They are intentionally not displayed in the clinician-facing assessment UI.

## Implementation Inventory

| Pathway definition                  | Version | Status                   |
| ----------------------------------- | ------- | ------------------------ |
| Sodium severity                     | `0.1.0` | Awaiting clinical review |
| Initial fluid-status assessment     | `0.2.0` | Awaiting clinical review |
| Emergency management                | `0.3.0` | Awaiting clinical review |
| Osmolality and urine classification | `0.4.0` | Awaiting clinical review |
| Source-supported management         | `0.7.0` | Awaiting clinical review |
| Operational result composer         | `0.7.0` | Awaiting clinical review |
| Connected assessment coordinator    | `0.7.0` | Awaiting clinical review |

## Implemented Pathway Map

```text
Latest sodium result
  -> automatic severity classification
  -> establish fluid status
       -> Hypovolaemic or Euvolaemic
            -> confirm all source-listed signs
                 -> one or more signs
                      -> emergency actions and correction safeguards
                      -> ODS risk when severe
                      -> symptomatic response
                           -> improved: cause management
                           -> not improved/uncertain: four-hour sodium change
                 -> no listed sign
                      -> Hypovolaemic: cause review + 0.9% sodium chloride
                      -> Euvolaemic: explicit underlying-cause review
       -> Hypervolaemic
            -> senior review + urine dip + treat underlying cause
  -> ask whether urine results are available
       -> no: classification stops; completed management output is retained
       -> yes: serum osmolality
            -> hypotonic: inherited fluid status + required urine findings
            -> isotonic: pseudohyponatraemia-compatible category
            -> hypertonic: translocational-compatible category
  -> Euvolaemic/no-sign route only: confirm source-listed cause state
  -> compose actions, warnings, monitoring, causes and rationale
  -> clinical-review lock
```

## Inputs And Progressive Disclosure

| Input                   | Unit/options                                                    | When requested                                       |
| ----------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Latest sodium           | mmol/L, one decimal maximum                                     | Once, at entry                                       |
| Fluid status            | Hypovolaemic, Euvolaemic, Hypervolaemic, unable safely          | After supported severity                             |
| Listed signs            | Nausea, vomiting, low GCS, ataxia, confusion, headache, or none | Hypovolaemic/Euvolaemic                              |
| ODS risk                | Confirmed, not confirmed, unable safely                         | Severe symptomatic branch                            |
| Symptomatic response    | Improved, not improved, unable safely                           | Symptomatic branch                                   |
| Four-hour sodium change | mmol/L, one decimal maximum                                     | No/uncertain symptomatic improvement                 |
| Urine results available | Yes/No                                                          | Classification entry                                 |
| Serum osmolality        | mOsm/kg                                                         | Results available                                    |
| Urine osmolality        | mOsm/kg                                                         | Hypotonic Euvolaemic branch                          |
| Urine sodium            | mEq/L                                                           | Hypotonic Hypovolaemic or selected Euvolaemic branch |
| Euvolaemic cause        | SIADH, water intoxication, other/unresolved, unable safely      | Euvolaemic with no listed sign                       |

Changing an upstream answer clears only dependent state. Hidden stale values are ignored by the
engine even if supplied programmatically.

## Threshold And Boundary Table

### Sodium severity

| Value                                         | Implemented result         |
| --------------------------------------------- | -------------------------- |
| `<125 mmol/L`                                 | Severe                     |
| `125-129 mmol/L` inclusive                    | Moderate                   |
| Greater than `129` and less than `130 mmol/L` | No printed band; stop      |
| `130-135 mmol/L` inclusive                    | Mild                       |
| Greater than `135 mmol/L`                     | Outside source bands; stop |

### Four-hour emergency response

| Confirmed change            | Implemented result                                            |
| --------------------------- | ------------------------------------------------------------- |
| `0` to less than `4 mmol/L` | Repeat 150 mL of 2.7% hypertonic saline and consultant review |
| `4.0-5.0 mmol/L` inclusive  | Undefined by source; stop                                     |
| Greater than `5 mmol/L`     | Diagnose and manage cause with consultant review              |
| Negative value              | No source branch; stop                                        |

Symptomatic improvement selects cause management without requesting the four-hour value.

### Classification

| Measurement                                                                       | Implemented result                    |
| --------------------------------------------------------------------------------- | ------------------------------------- |
| Serum osmolality `<275 mOsm/kg`                                                   | Hypotonic                             |
| Serum osmolality `>275` and `<295 mOsm/kg`                                        | Isotonic-compatible                   |
| Serum osmolality `>295 mOsm/kg`                                                   | Hypertonic-compatible                 |
| Serum osmolality exactly `275` or `295`                                           | Undefined equality; stop              |
| Hypovolaemic urine sodium `<40 mEq/L`                                             | Non-renal salt-loss pattern           |
| Hypovolaemic urine sodium `>40 mEq/L`                                             | Renal salt-loss pattern               |
| Urine sodium exactly `40 mEq/L`                                                   | Undefined equality; stop              |
| Euvolaemic urine osmolality `<100 mOsm/kg`                                        | Primary-polydipsia/low-solute pattern |
| Euvolaemic urine osmolality `>100 mOsm/kg` plus urine sodium `>40 mEq/L`          | SIADH-compatible pattern              |
| Urine osmolality exactly `100 mOsm/kg`                                            | Undefined equality; stop              |
| Euvolaemic urine sodium at or below `40 mEq/L` after urine osmolality above `100` | No supplied category; stop            |

## Actions

| Branch                                     | Implemented action                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Pre-treatment, if possible                 | Obtain urine osmolality, urinary sodium, random blood glucose, U&Es, TSH and cortisol         |
| Symptomatic Hypovolaemic/Euvolaemic        | 150 mL of 2.7% hypertonic saline via a central or large peripheral vein                       |
| Four-hour increase below 4                 | Repeat 150 mL of 2.7% hypertonic saline and obtain consultant review                          |
| Symptoms improved or increase above 5      | Diagnose and manage the cause with consultant review                                          |
| Non-emergency Hypovolaemic                 | Review causes/history and use 1000 mL of 0.9% sodium chloride over 6-8 hours                  |
| Post-emergency Hypovolaemic cause endpoint | Add 1000 mL of 0.9% sodium chloride over 6-8 hours                                            |
| Water intoxication established             | Fluid restriction and consultant review                                                       |
| SIADH established                          | Redirect to the separate SIADH pathway and obtain consultant review; no local SIADH treatment |
| Hypervolaemic                              | Refer to a senior clinician, obtain a urine dip and treat the underlying cause                |

## Warnings, Targets And Monitoring

- Initial target: increase sodium by `4-6 mmol/L` in the first `2-4 hours`.
- Critical maximum: avoid correction of more than `10 mmol/L` in `24 hours`.
- Severe symptomatic Hyponatraemia with confirmed high ODS risk: monitor sodium hourly until an
  increase of `4-6 mmol/L`, then every `4-6 hours` using a blood gas machine.
- Classification warning: rule out hypothyroidism and secondary adrenal insufficiency in all cases.
- SIADH warning: no dedicated SIADH source was supplied, so no SIADH treatment is generated.
- No monitoring schedule is invented for branches where the source does not state one.

## Compatible Cause Categories

| Pattern                        | Source-listed examples                                   |
| ------------------------------ | -------------------------------------------------------- |
| Non-renal salt loss            | Vomiting, diarrhoea                                      |
| Renal salt loss                | Diuretics, primary adrenal insufficiency                 |
| Primary polydipsia/low solute  | Primary polydipsia, malnutrition or low-solute intake    |
| SIADH-compatible               | Syndrome of inappropriate antidiuretic hormone secretion |
| Hypervolaemic                  | Heart failure, cirrhosis, nephrotic syndrome             |
| Pseudohyponatraemia-compatible | Paraproteinaemia, hyperlipidaemia                        |
| Translocational-compatible     | Hyperglycaemia, exogenous solutes such as mannitol       |

These outputs are compatible categories, not diagnoses. A clinician-confirmed management cause is
displayed separately from a laboratory-compatible pattern.

## Internal Source Mapping

| Source location                                               | Implemented area                              |
| ------------------------------------------------------------- | --------------------------------------------- |
| Trust page 1: initial investigations                          | Emergency immediate actions                   |
| Trust page 1: severity                                        | Sodium numeric branch                         |
| Trust page 1: establish fluid status                          | Fluid-status question                         |
| Trust page 1: signs of cerebral oedema                        | Grouped sign selector and emergency branch    |
| Trust page 1: correction target/limit                         | Emergency target and critical warning         |
| Trust page 1: response branches                               | Symptom response and four-hour numeric branch |
| Trust page 1: ODS monitoring                                  | Conditional monitoring timeline               |
| Trust page 1: Euvolaemia/Hypovolaemia/Hypervolaemia endpoints | Source-supported management engine            |
| Classification images: serum osmolality                       | Tonicity branch                               |
| Classification images: ECV and urine findings                 | Compatible cause branches                     |
| Classification images: exclusion note                         | Thyroid/adrenal warning                       |

## Ambiguity Register

| ID            | Unresolved item                                                         | Current safe behavior                       |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| `HYP-AMB-001` | Decimal sodium values between 129 and 130                               | Stop without severity or management         |
| `HYP-AMB-002` | Four-hour increase from 4.0 through 5.0                                 | Stop without repeat or cause action         |
| `HYP-AMB-003` | High ODS-risk criteria are absent                                       | Require explicit clinician confirmation     |
| `HYP-AMB-004` | Serum osmolality equality at 275/295                                    | Stop without tonicity category              |
| `HYP-AMB-005` | Urine osmolality equality at 100                                        | Stop without cause category                 |
| `HYP-AMB-006` | Urine sodium equality at 40                                             | Stop without cause category                 |
| `HYP-AMB-007` | Euvolaemic urine sodium at/below 40 after urine osmolality above 100    | Stop without cause category                 |
| `HYP-AMB-008` | Classification-image provenance and approval are unknown                | Keep source and pathway unapproved          |
| `HYP-AMB-009` | Referenced separate SIADH pathway was not supplied                      | Redirect only; generate no SIADH treatment  |
| `HYP-AMB-010` | Placement of the Hypovolaemic 0.9% sodium-chloride add-on               | Implement at cause endpoint; require review |
| `HYP-AMB-011` | Criteria for confirming water intoxication are not stated               | Require explicit clinician confirmation     |
| `HYP-AMB-012` | Hypervolaemic endpoint does not state a complete monitoring/timing plan | Do not invent one                           |

## Review Cases

1. Severe emergency and SIADH-compatible classification: sodium `124`, Euvolaemic, Confusion,
   high ODS risk, symptoms improved, serum osmolality `270`, urine osmolality `120`, urine sodium
   `40.1`.
2. Non-emergency Hypovolaemic: sodium `129`, no listed sign, serum osmolality `270`, urine sodium
   `20`.
3. Water intoxication: sodium `129`, Euvolaemic, no listed sign, urine results unavailable, water
   intoxication established.
4. SIADH redirect: sodium `129`, Euvolaemic, no listed sign, serum osmolality `270`, urine
   osmolality `120`, urine sodium `40.1`, SIADH already established.
5. Hypervolaemic endpoint: sodium `129`, Hypervolaemic, urine results unavailable.
6. Fail-closed review: repeat each exact undefined boundary in the ambiguity register.

## Technical Evidence

- Clinical engine tests cover severity, fluid status, emergency management, classification,
  source-supported management, operational composition and connected coordination.
- Component tests cover adaptive disclosure, exclusive no-sign selection, dependency resets,
  restart confirmation, result presentation and absence of visible internal references.
- Playwright tests cover complete branches, Back/restart behavior, mobile overflow and automated
  accessibility checks.
- Source-registry verification confirms the original source files remain hash-identical.

## Review Routes And Screenshots

- Connected assessment: `/review/hyponatraemia/assessment`
- Fixed emergency result: `/review/hyponatraemia/result`
- Component review routes remain available for severity, fluid status, emergency management and
  classification.

Key screenshots:

- [Connected emergency result, desktop](../../screenshots/subtask-11/hyponatraemia-connected-result-desktop.png)
- [Connected emergency result, mobile](../../screenshots/subtask-11/hyponatraemia-connected-result-mobile.png)
- [Euvolaemic cause review, desktop](../../screenshots/subtask-12a/hyponatraemia-cause-review-desktop.png)
- [Water-intoxication result, desktop](../../screenshots/subtask-12a/hyponatraemia-water-intoxication-result-desktop.png)
- [Water-intoxication result, mobile](../../screenshots/subtask-12a/hyponatraemia-water-intoxication-result-mobile.png)

## Privacy, Accessibility And State

- No patient identifiers are requested.
- Answers remain only in React memory and are cleared on refresh or navigation away.
- No answers are placed in URLs, browser storage, cookies, analytics, logs or a database.
- The workflow supports keyboard navigation, semantic labels, visible focus, accessible alerts and
  automated axe checks.
- Upstream changes clear dependent state and Back preserves still-valid answers.

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
