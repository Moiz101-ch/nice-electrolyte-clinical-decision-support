# Hyponatraemia Emergency Management

## Status

- Application pathway: `hyponatraemia-emergency-management`
- Version: `0.3.0`
- Clinical review: `awaiting-clinical-review`
- Scope: symptomatic emergency treatment, correction safeguards, response and ODS monitoring
- Activation status: review only; not available for clinical use

## Primary Source

- Source ID: `YSTHFT-HYPONATRAEMIA-EMERGENCY-V1`
- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Document: _Emergency Management of Hyponatraemia_
- Document version: `1.0`
- Source location: page 1, cerebral-oedema `Yes` branch
- Issue/review window: February 2025 to February 2028

This implementation is Trust-pathway-derived. It is not labelled as NICE management guidance.

## NICE Boundary Check

The [NICE adult IV-fluid guideline CG174](https://www.nice.org.uk/guidance/cg174/chapter/recommendations)
does not provide this exact general-adult symptomatic hyponatraemia regimen. NICE NG29 contains a
different weight-based pathway for children and young people; it is not used to define this adult
implementation. No paediatric or peripartum dose has been merged into the Trust pathway.

## Source-Derived Emergency Output

| Stage                                                | Implemented output                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Before treatment, if possible                        | Urine osmolality and urinary sodium, random blood glucose, U&Es, TSH and cortisol                       |
| Initial treatment                                    | `150 mL` of `2.7%` hypertonic saline via a central or large peripheral vein for hypovolaemia/euvolaemia |
| Initial target                                       | Increase sodium by `4-6 mmol/L` in the first `2-4 hours`                                                |
| Correction limit                                     | Avoid correction above `10 mmol/L` in `24 hours`                                                        |
| Increase below `4 mmol/L` at 4 hours                 | Repeat `150 mL` of `2.7%` hypertonic saline and obtain consultant review                                |
| Symptomatic improvement or increase above `5 mmol/L` | Diagnose and manage the cause with consultant review                                                    |

## Monitoring

For severe symptomatic hyponatraemia with clinically confirmed high ODS risk, the source states:

1. Monitor sodium hourly until it has increased by `4-6 mmol/L`.
2. Then monitor every `4-6 hours` using a blood gas machine.

The source does not define high-ODS-risk criteria. The interface therefore requires an explicit
clinical confirmation and does not infer risk from diagnoses or patient characteristics.

## Fail-Closed Edge Cases

| Condition                                       | Safe behavior                                                  |
| ----------------------------------------------- | -------------------------------------------------------------- |
| Sodium change from `4.0` through `5.0 mmol/L`   | Stop for clinical review; no repeat or cause-management branch |
| Negative four-hour change                       | Stop for clinical review                                       |
| More than 1 decimal place                       | Block as invalid input                                         |
| Incorrect unit                                  | Block as invalid input                                         |
| Unknown ODS or response value                   | Block as invalid input                                         |
| Upstream ODS status changes                     | Clear symptom response and sodium-change answers               |
| Symptoms improve with stale sodium-change input | Ignore the unvisited numeric input                             |
| Mild/moderate case with stale ODS input         | Ignore the ODS input and do not add high-risk monitoring       |
| Non-emergency or contradictory sign branch      | Generate no emergency treatment output                         |

## Clinical Review Questions

1. Confirm every treatment instruction, concentration, volume, route and timing against current local policy.
2. Clarify the intended response for sodium increases from `4.0` through `5.0 mmol/L`.
3. Confirm whether negative sodium changes should join the repeat-dose branch or require another response.
4. Define or reference the local criteria used to establish high ODS risk.
5. Confirm whether consultant review requires a more explicit urgency or escalation destination.
